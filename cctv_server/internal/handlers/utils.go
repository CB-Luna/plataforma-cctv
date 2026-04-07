package handlers

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/crypto/bcrypt"
)

// HashPassword genera un hash bcrypt de la contraseña
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// CheckPasswordHash verifica si una contraseña coincide con su hash
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// JWTClaims estructura personalizada para los claims del JWT
type JWTClaims struct {
	UserID   string   `json:"user_id"`
	TenantID string   `json:"tenant_id"`
	Email    string   `json:"email"`
	Roles    []string `json:"roles"`
	jwt.RegisteredClaims
}

// GenerateJWT genera un token JWT con los datos del usuario
func GenerateJWT(userID, tenantID, email string, roles []string, secret string, expiresIn time.Duration) (string, error) {
	claims := JWTClaims{
		UserID:   userID,
		TenantID: tenantID,
		Email:    email,
		Roles:    roles,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiresIn)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// toPgUUID convierte un string UUID a pgtype.UUID
func toPgUUID(uuidStr string) (pgtype.UUID, error) {
	id, err := uuid.Parse(uuidStr)
	if err != nil {
		return pgtype.UUID{}, err
	}

	var pgUUID pgtype.UUID
	if err := pgUUID.Scan(id.String()); err != nil {
		return pgtype.UUID{}, err
	}
	return pgUUID, nil
}

// pgUUIDToString convierte un pgtype.UUID a string
func pgUUIDToString(pgUUID pgtype.UUID) string {
	if !pgUUID.Valid {
		return ""
	}
	return fmt.Sprintf("%x-%x-%x-%x-%x",
		pgUUID.Bytes[0:4],
		pgUUID.Bytes[4:6],
		pgUUID.Bytes[6:8],
		pgUUID.Bytes[8:10],
		pgUUID.Bytes[10:16])
}

// nullStringPtr convierte un string a puntero, nil si está vacío
func nullStringPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// boolValue safely dereferences a *bool pointer, returning false if nil
func boolValue(b *bool) bool {
	if b == nil {
		return false
	}
	return *b
}

// int32Value safely dereferences a *int32 pointer, returning 0 if nil
func int32Value(i *int32) int32 {
	if i == nil {
		return 0
	}
	return *i
}

// boolPtr returns a pointer for the given boolean
func boolPtr(b bool) *bool {
	return &b
}

// safeString safely dereferences a *string pointer, returning empty string if nil
func safeString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// safeBool safely dereferences a *bool pointer, returning false if nil
func safeBool(b *bool) bool {
	if b == nil {
		return false
	}
	return *b
}

// safeInt32 safely dereferences a *int32 pointer, returning 0 if nil
func safeInt32(i *int32) int32 {
	if i == nil {
		return 0
	}
	return *i
}

// int32Ptr returns a pointer to the given int32
func int32Ptr(i int32) *int32 {
	return &i
}
