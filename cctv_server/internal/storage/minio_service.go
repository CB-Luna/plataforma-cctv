package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/url"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/symtickets/cctv_server/internal/config"
	"github.com/symtickets/cctv_server/internal/database"
)

type StoredObject struct {
	Bucket      string
	ObjectKey   string
	Size        int64
	ContentType string
	Provider    string
}

type MinIOService struct {
	queries *database.Queries
	cfg     *config.Config
}

type minioResolvedConfig struct {
	Endpoint  string
	AccessKey string
	SecretKey string
	Bucket    string
	Region    string
	UseSSL    bool
}

func NewMinIOService(queries *database.Queries, cfg *config.Config) *MinIOService {
	return &MinIOService{
		queries: queries,
		cfg:     cfg,
	}
}

func (s *MinIOService) UploadObject(
	ctx context.Context,
	tenantID pgtype.UUID,
	moduleName string,
	objectKey string,
	contentType string,
	data []byte,
) (*StoredObject, error) {
	client, resolved, err := s.newClient(ctx, tenantID, moduleName)
	if err != nil {
		return nil, err
	}

	exists, err := client.BucketExists(ctx, resolved.Bucket)
	if err != nil {
		return nil, fmt.Errorf("failed to verify bucket %s: %w", resolved.Bucket, err)
	}

	if !exists {
		if err := client.MakeBucket(ctx, resolved.Bucket, minio.MakeBucketOptions{
			Region: resolved.Region,
		}); err != nil {
			return nil, fmt.Errorf("failed to create bucket %s: %w", resolved.Bucket, err)
		}
	}

	info, err := client.PutObject(
		ctx,
		resolved.Bucket,
		objectKey,
		bytes.NewReader(data),
		int64(len(data)),
		minio.PutObjectOptions{
			ContentType: contentType,
		},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to upload object %s: %w", objectKey, err)
	}

	return &StoredObject{
		Bucket:      resolved.Bucket,
		ObjectKey:   objectKey,
		Size:        info.Size,
		ContentType: contentType,
		Provider:    "minio",
	}, nil
}

func (s *MinIOService) GetObject(
	ctx context.Context,
	tenantID pgtype.UUID,
	moduleName string,
	bucketName string,
	objectKey string,
) (io.ReadCloser, minio.ObjectInfo, error) {
	client, resolved, err := s.newClient(ctx, tenantID, moduleName)
	if err != nil {
		return nil, minio.ObjectInfo{}, err
	}

	bucket := bucketName
	if bucket == "" {
		bucket = resolved.Bucket
	}

	object, err := client.GetObject(ctx, bucket, objectKey, minio.GetObjectOptions{})
	if err != nil {
		return nil, minio.ObjectInfo{}, fmt.Errorf("failed to get object %s: %w", objectKey, err)
	}

	info, err := object.Stat()
	if err != nil {
		object.Close()
		return nil, minio.ObjectInfo{}, fmt.Errorf("failed to stat object %s: %w", objectKey, err)
	}

	return object, info, nil
}

func (s *MinIOService) DeleteObject(
	ctx context.Context,
	tenantID pgtype.UUID,
	moduleName string,
	bucketName string,
	objectKey string,
) error {
	client, resolved, err := s.newClient(ctx, tenantID, moduleName)
	if err != nil {
		return err
	}

	bucket := bucketName
	if bucket == "" {
		bucket = resolved.Bucket
	}

	if err := client.RemoveObject(ctx, bucket, objectKey, minio.RemoveObjectOptions{}); err != nil {
		return fmt.Errorf("failed to remove object %s: %w", objectKey, err)
	}

	return nil
}

func (s *MinIOService) newClient(
	ctx context.Context,
	tenantID pgtype.UUID,
	moduleName string,
) (*minio.Client, *minioResolvedConfig, error) {
	resolved, err := s.resolveConfig(ctx, tenantID, moduleName)
	if err != nil {
		return nil, nil, err
	}

	client, err := minio.New(resolved.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(resolved.AccessKey, resolved.SecretKey, ""),
		Secure: resolved.UseSSL,
		Region: resolved.Region,
	})
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create minio client: %w", err)
	}

	return client, resolved, nil
}

func (s *MinIOService) resolveConfig(
	ctx context.Context,
	tenantID pgtype.UUID,
	moduleName string,
) (*minioResolvedConfig, error) {
	if tenantID.Valid {
		if moduleName != "" {
			mapping, err := s.queries.GetModuleStorageMapping(ctx, tenantID, moduleName)
			if err == nil && mapping.ProviderName == "minio" && boolFromPtr(mapping.IsActive, true) {
				configRow, cfgErr := s.queries.GetStorageConfiguration(ctx, mapping.ConfigID, tenantID)
				if cfgErr == nil {
					resolved, convErr := configRowToMinIOConfig(configRow)
					if convErr == nil {
						return resolved, nil
					}
				}
			}
		}

		provider, err := s.queries.GetStorageProviderByName(ctx, "minio")
		if err == nil {
			configRow, cfgErr := s.queries.GetDefaultStorageConfig(ctx, tenantID, provider.ID)
			if cfgErr == nil {
				resolved, convErr := configRowToMinIOConfig(configRow)
				if convErr == nil {
					return resolved, nil
				}
			}
		}
	}

	return configFromEnv(s.cfg)
}

func configRowToMinIOConfig(configRow database.StorageStorageConfiguration) (*minioResolvedConfig, error) {
	baseURL := stringPtrValue(configRow.BaseUrl)
	if baseURL == "" && configRow.Host != nil {
		port := ""
		if configRow.Port != nil {
			port = ":" + strconv.Itoa(int(*configRow.Port))
		}
		baseURL = fmt.Sprintf("http://%s%s", *configRow.Host, port)
	}

	endpoint, useSSL, err := parseMinIOEndpoint(baseURL)
	if err != nil {
		return nil, err
	}

	accessKey := stringPtrValue(configRow.ApiKey)
	if accessKey == "" {
		accessKey = stringPtrValue(configRow.Username)
	}

	secretKey := stringPtrValue(configRow.SecretKey)
	if secretKey == "" {
		secretKey = stringPtrValue(configRow.PasswordText)
	}

	bucket := stringPtrValue(configRow.BucketName)
	if endpoint == "" || accessKey == "" || secretKey == "" || bucket == "" {
		return nil, fmt.Errorf("incomplete minio configuration")
	}

	region := stringPtrValue(configRow.Region)
	if region == "" {
		region = "us-east-1"
	}

	return &minioResolvedConfig{
		Endpoint:  endpoint,
		AccessKey: accessKey,
		SecretKey: secretKey,
		Bucket:    bucket,
		Region:    region,
		UseSSL:    useSSL,
	}, nil
}

func configFromEnv(cfg *config.Config) (*minioResolvedConfig, error) {
	endpoint, useSSL, err := parseMinIOEndpoint(cfg.MinIOBaseURL)
	if err != nil {
		return nil, err
	}

	if endpoint == "" || cfg.MinIOAccessKey == "" || cfg.MinIOSecretKey == "" || cfg.MinIOBucket == "" {
		return nil, fmt.Errorf("minio configuration is missing; define tenant storage configuration or MINIO_* env vars")
	}

	region := cfg.MinIORegion
	if region == "" {
		region = "us-east-1"
	}

	if cfg.MinIOUseSSL != "" {
		override, convErr := strconv.ParseBool(cfg.MinIOUseSSL)
		if convErr == nil {
			useSSL = override
		}
	}

	return &minioResolvedConfig{
		Endpoint:  endpoint,
		AccessKey: cfg.MinIOAccessKey,
		SecretKey: cfg.MinIOSecretKey,
		Bucket:    cfg.MinIOBucket,
		Region:    region,
		UseSSL:    useSSL,
	}, nil
}

func parseMinIOEndpoint(baseURL string) (string, bool, error) {
	baseURL = strings.TrimSpace(baseURL)
	if baseURL == "" {
		return "", false, nil
	}

	if !strings.Contains(baseURL, "://") {
		return strings.TrimSuffix(baseURL, "/"), false, nil
	}

	parsed, err := url.Parse(baseURL)
	if err != nil {
		return "", false, fmt.Errorf("invalid minio base url: %w", err)
	}

	endpoint := parsed.Host
	if endpoint == "" {
		return "", false, fmt.Errorf("invalid minio base url: host is required")
	}

	return endpoint, parsed.Scheme == "https", nil
}

func stringPtrValue(value *string) string {
	if value == nil {
		return ""
	}
	return strings.TrimSpace(*value)
}

func boolFromPtr(value *bool, fallback bool) bool {
	if value == nil {
		return fallback
	}
	return *value
}
