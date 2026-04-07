package config

import (
	"fmt"
	"os"
)

type Config struct {
	DatabaseURL             string
	ServerPort              string
	JWTSecret               string
	JWTExpiresIn            string
	Environment             string
	MinIOBaseURL            string
	MinIOAccessKey          string
	MinIOSecretKey          string
	MinIOBucket             string
	MinIORegion             string
	MinIOUseSSL             string
}

func Load() (*Config, error) {
	// Cargar desde variables de entorno
	cfg := &Config{
		DatabaseURL:             getEnv("DATABASE_URL", ""),
		ServerPort:              getEnv("SERVER_PORT", "8080"),
		JWTSecret:               getEnv("JWT_SECRET", ""),
		JWTExpiresIn:            getEnv("JWT_EXPIRES_IN", "15m"),
		Environment:             getEnv("SERVER_ENV", "development"),
		MinIOBaseURL:            getEnv("MINIO_BASE_URL", getEnv("MINIO_ENDPOINT", "")),
		MinIOAccessKey:          getEnv("MINIO_ACCESS_KEY", ""),
		MinIOSecretKey:          getEnv("MINIO_SECRET_KEY", ""),
		MinIOBucket:             getEnv("MINIO_BUCKET", ""),
		MinIORegion:             getEnv("MINIO_REGION", "us-east-1"),
		MinIOUseSSL:             getEnv("MINIO_USE_SSL", ""),
	}

	// Validar configuración requerida
	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
