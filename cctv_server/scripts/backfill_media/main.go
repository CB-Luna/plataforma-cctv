package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/symtickets/cctv_server/internal/config"
	"github.com/symtickets/cctv_server/internal/database"
	objectstorage "github.com/symtickets/cctv_server/internal/storage"
)

type counters struct {
	avatarsMigrated int
	avatarsSkipped  int
	avatarsFailed   int
	logosMigrated   int
	logosSkipped    int
	logosFailed     int
}

func main() {
	var (
		dryRun   = flag.Bool("dry-run", false, "Simulate migration without writing to MinIO or database")
		tenantID = flag.String("tenant-id", "", "Migrate only one tenant UUID")
	)
	flag.Parse()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	ctx := context.Background()
	dbPool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer dbPool.Close()

	queries := database.New(dbPool)
	storageService := objectstorage.NewMinIOService(queries, cfg)

	var filterTenant *pgtype.UUID
	if *tenantID != "" {
		pgTenantID, convErr := toPgUUID(*tenantID)
		if convErr != nil {
			log.Fatalf("invalid tenant-id: %v", convErr)
		}
		filterTenant = &pgTenantID
	}

	stats := &counters{}

	if err := backfillTenantLogos(ctx, queries, storageService, filterTenant, *dryRun, stats); err != nil {
		log.Fatalf("tenant logo backfill failed: %v", err)
	}

	if err := backfillUserAvatars(ctx, queries, storageService, filterTenant, *dryRun, stats); err != nil {
		log.Fatalf("user avatar backfill failed: %v", err)
	}

	log.Printf("backfill completed")
	log.Printf("avatars migrated=%d skipped=%d failed=%d", stats.avatarsMigrated, stats.avatarsSkipped, stats.avatarsFailed)
	log.Printf("logos migrated=%d skipped=%d failed=%d", stats.logosMigrated, stats.logosSkipped, stats.logosFailed)
}

func backfillTenantLogos(
	ctx context.Context,
	queries *database.Queries,
	storageService *objectstorage.MinIOService,
	filterTenant *pgtype.UUID,
	dryRun bool,
	stats *counters,
) error {
	tenants, err := queries.ListTenants(ctx, 100000, 0)
	if err != nil {
		return err
	}

	for _, tenant := range tenants {
		if filterTenant != nil && tenant.ID != *filterTenant {
			continue
		}

		if tenant.LogoUrl == nil || strings.TrimSpace(*tenant.LogoUrl) == "" {
			stats.logosSkipped++
			continue
		}

		currentURL := strings.TrimSpace(*tenant.LogoUrl)
		if isStoragePublicURL(currentURL) {
			stats.logosSkipped++
			continue
		}

		data, contentType, originalName, err := downloadSource(currentURL)
		if err != nil {
			stats.logosFailed++
			log.Printf("[logo] tenant=%s download failed: %v", tenant.Name, err)
			continue
		}

		if dryRun {
			stats.logosMigrated++
			log.Printf("[logo] dry-run tenant=%s url=%s", tenant.Name, currentURL)
			continue
		}

		fileID, publicURL, err := persistObject(
			ctx,
			queries,
			storageService,
			tenant.ID,
			pgtype.UUID{},
			"tenant_logo",
			"tenants",
			tenant.ID,
			fmt.Sprintf("tenants/%s/logos/%s%s", pgUUIDToString(tenant.ID), uuid.NewString(), extensionForName(originalName)),
			contentType,
			originalName,
			data,
			map[string]interface{}{
				"source_url":      currentURL,
				"backfilled_at":   time.Now().UTC().Format(time.RFC3339),
				"backfill_legacy": true,
				"tenant_name":     tenant.Name,
			},
		)
		if err != nil {
			stats.logosFailed++
			log.Printf("[logo] tenant=%s persist failed: %v", tenant.Name, err)
			continue
		}

		_, err = queries.UpdateTenantTheme(
			ctx,
			tenant.ID,
			tenant.PrimaryColor,
			tenant.SecondaryColor,
			tenant.TertiaryColor,
			&publicURL,
		)
		if err != nil {
			stats.logosFailed++
			log.Printf("[logo] tenant=%s update failed: %v", tenant.Name, err)
			continue
		}

		if cleanupErr := deletePreviousEntityFiles(ctx, queries, storageService, tenant.ID, "tenants", tenant.ID, "tenant_logo", fileID, "tenant_logo"); cleanupErr != nil {
			log.Printf("[logo] tenant=%s cleanup warning: %v", tenant.Name, cleanupErr)
		}

		stats.logosMigrated++
		log.Printf("[logo] tenant=%s migrated", tenant.Name)
	}

	return nil
}

func backfillUserAvatars(
	ctx context.Context,
	queries *database.Queries,
	storageService *objectstorage.MinIOService,
	filterTenant *pgtype.UUID,
	dryRun bool,
	stats *counters,
) error {
	users, err := queries.ListAllUsersGlobal(ctx, 100000, 0)
	if err != nil {
		return err
	}

	for _, user := range users {
		if filterTenant != nil && user.TenantID != *filterTenant {
			continue
		}

		if user.AvatarUrl == nil || strings.TrimSpace(*user.AvatarUrl) == "" {
			stats.avatarsSkipped++
			continue
		}

		currentURL := strings.TrimSpace(*user.AvatarUrl)
		if isStoragePublicURL(currentURL) {
			stats.avatarsSkipped++
			continue
		}

		data, contentType, originalName, err := downloadSource(currentURL)
		if err != nil {
			stats.avatarsFailed++
			log.Printf("[avatar] user=%s download failed: %v", user.Email, err)
			continue
		}

		if dryRun {
			stats.avatarsMigrated++
			log.Printf("[avatar] dry-run user=%s url=%s", user.Email, currentURL)
			continue
		}

		fileID, publicURL, err := persistObject(
			ctx,
			queries,
			storageService,
			user.TenantID,
			pgtype.UUID{},
			"user_avatar",
			"users",
			user.ID,
			fmt.Sprintf("tenants/%s/avatars/%s/%s%s", pgUUIDToString(user.TenantID), pgUUIDToString(user.ID), uuid.NewString(), extensionForName(originalName)),
			contentType,
			originalName,
			data,
			map[string]interface{}{
				"source_url":      currentURL,
				"backfilled_at":   time.Now().UTC().Format(time.RFC3339),
				"backfill_legacy": true,
				"user_email":      user.Email,
			},
		)
		if err != nil {
			stats.avatarsFailed++
			log.Printf("[avatar] user=%s persist failed: %v", user.Email, err)
			continue
		}

		if _, err := queries.UpdateUserAvatar(ctx, user.ID, user.TenantID, &publicURL); err != nil {
			stats.avatarsFailed++
			log.Printf("[avatar] user=%s update failed: %v", user.Email, err)
			continue
		}

		if cleanupErr := deletePreviousEntityFiles(ctx, queries, storageService, user.TenantID, "users", user.ID, "user_avatar", fileID, "users_avatar"); cleanupErr != nil {
			log.Printf("[avatar] user=%s cleanup warning: %v", user.Email, cleanupErr)
		}

		stats.avatarsMigrated++
		log.Printf("[avatar] user=%s migrated", user.Email)
	}

	return nil
}

func persistObject(
	ctx context.Context,
	queries *database.Queries,
	storageService *objectstorage.MinIOService,
	tenantID pgtype.UUID,
	uploadedBy pgtype.UUID,
	category string,
	entityType string,
	entityID pgtype.UUID,
	objectPath string,
	contentType string,
	originalName string,
	data []byte,
	metadata map[string]interface{},
) (pgtype.UUID, string, error) {
	hash := sha256.Sum256(data)
	hashHex := hex.EncodeToString(hash[:])
	metadataJSON, _ := json.Marshal(metadata)

	storedObject, err := storageService.UploadObject(ctx, tenantID, moduleNameForCategory(category), objectPath, contentType, data)
	if err != nil {
		return pgtype.UUID{}, "", err
	}

	fileName := filepath.Base(objectPath)
	dbFile, err := queries.CreateFile(ctx, database.CreateFileParams{
		TenantID:          tenantID,
		Filename:          fileName,
		OriginalFilename:  originalName,
		MimeType:          contentType,
		FileSize:          int64(len(data)),
		FileHash:          &hashHex,
		StorageProvider:   &storedObject.Provider,
		StorageBucket:     &storedObject.Bucket,
		StoragePath:       objectPath,
		StorageUrl:        nil,
		Category:          &category,
		RelatedEntityType: &entityType,
		RelatedEntityID:   entityID,
		Metadata:          metadataJSON,
		UploadedBy:        uploadedBy,
	})
	if err != nil {
		_ = storageService.DeleteObject(ctx, tenantID, moduleNameForCategory(category), storedObject.Bucket, objectPath)
		return pgtype.UUID{}, "", err
	}

	publicURL := fmt.Sprintf("/api/v1/storage/public/%s", pgUUIDToString(dbFile.ID))
	return dbFile.ID, publicURL, nil
}

func deletePreviousEntityFiles(
	ctx context.Context,
	queries *database.Queries,
	storageService *objectstorage.MinIOService,
	tenantID pgtype.UUID,
	entityType string,
	entityID pgtype.UUID,
	category string,
	keepFileID pgtype.UUID,
	moduleName string,
) error {
	files, err := queries.ListFilesByEntity(ctx, tenantID, &entityType, entityID)
	if err != nil {
		return err
	}

	for _, file := range files {
		if file.Category == nil || *file.Category != category {
			continue
		}
		if keepFileID.Valid && file.ID == keepFileID {
			continue
		}

		if err := storageService.DeleteObject(ctx, tenantID, moduleName, stringPtr(file.StorageBucket), file.StoragePath); err != nil {
			log.Printf("cleanup warning for file=%s: %v", pgUUIDToString(file.ID), err)
		}
		if err := queries.DeleteFile(ctx, file.ID, tenantID); err != nil {
			log.Printf("metadata cleanup warning for file=%s: %v", pgUUIDToString(file.ID), err)
		}
	}

	return nil
}

func downloadSource(sourceURL string) ([]byte, string, string, error) {
	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Get(sourceURL)
	if err != nil {
		return nil, "", "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, "", "", fmt.Errorf("unexpected status %d", resp.StatusCode)
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", "", err
	}

	contentType := resp.Header.Get("Content-Type")
	if contentType == "" {
		contentType = http.DetectContentType(data)
	}

	fileName := fileNameFromURL(sourceURL)
	if fileName == "" {
		fileName = uuid.NewString() + extensionForContentType(contentType)
	}

	return data, contentType, fileName, nil
}

func isStoragePublicURL(value string) bool {
	return strings.Contains(value, "/api/v1/storage/public/")
}

func moduleNameForCategory(category string) string {
	switch category {
	case "tenant_logo":
		return "tenant_logo"
	case "user_avatar":
		return "users_avatar"
	default:
		return "storage"
	}
}

func fileNameFromURL(rawURL string) string {
	parts := strings.Split(rawURL, "?")
	base := parts[0]
	segments := strings.Split(base, "/")
	if len(segments) == 0 {
		return ""
	}
	return segments[len(segments)-1]
}

func extensionForName(fileName string) string {
	ext := filepath.Ext(fileName)
	if ext != "" {
		return ext
	}
	return ".bin"
}

func extensionForContentType(contentType string) string {
	switch contentType {
	case "image/jpeg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/gif":
		return ".gif"
	case "image/webp":
		return ".webp"
	case "image/svg+xml":
		return ".svg"
	default:
		return ".bin"
	}
}

func stringPtr(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func toPgUUID(value string) (pgtype.UUID, error) {
	var result pgtype.UUID
	if err := result.Scan(value); err != nil {
		return pgtype.UUID{}, err
	}
	return result, nil
}

func pgUUIDToString(value pgtype.UUID) string {
	if !value.Valid {
		return ""
	}
	return uuid.UUID(value.Bytes).String()
}
