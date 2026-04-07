package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/symtickets/cctv_server/internal/middleware"
)

type floorPlanSiteListItem struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	ClientName    string  `json:"client_name,omitempty"`
	Address       *string `json:"address,omitempty"`
	City          *string `json:"city,omitempty"`
	State         *string `json:"state,omitempty"`
	CameraCount   int     `json:"camera_count"`
	NvrCount      int     `json:"nvr_count"`
	HasFloorPlan  bool    `json:"has_floor_plan"`
	FloorPlanName *string `json:"floor_plan_name,omitempty"`
	UpdatedAt     *string `json:"updated_at,omitempty"`
}

type floorPlanSiteSummary struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	ClientName  string  `json:"client_name,omitempty"`
	Address     *string `json:"address,omitempty"`
	City        *string `json:"city,omitempty"`
	State       *string `json:"state,omitempty"`
	CameraCount int     `json:"camera_count"`
	NvrCount    int     `json:"nvr_count"`
}

type floorPlanRecord struct {
	ID               string                 `json:"id"`
	SiteID           string                 `json:"site_id"`
	Name             string                 `json:"name"`
	Version          int                    `json:"version"`
	CanvasWidth      int                    `json:"canvas_width"`
	CanvasHeight     int                    `json:"canvas_height"`
	GridSize         int                    `json:"grid_size"`
	BackgroundFileID *string                `json:"background_file_id,omitempty"`
	Document         map[string]interface{} `json:"document"`
	CreatedAt        string                 `json:"created_at"`
	UpdatedAt        string                 `json:"updated_at"`
}

type floorPlanSiteDetailResponse struct {
	Site      floorPlanSiteSummary `json:"site"`
	FloorPlan *floorPlanRecord     `json:"floor_plan,omitempty"`
}

type saveFloorPlanRequest struct {
	Name             string                 `json:"name" binding:"required"`
	Version          int                    `json:"version"`
	CanvasWidth      int                    `json:"canvas_width" binding:"required"`
	CanvasHeight     int                    `json:"canvas_height" binding:"required"`
	GridSize         int                    `json:"grid_size" binding:"required"`
	BackgroundFileID *string                `json:"background_file_id,omitempty"`
	Document         map[string]interface{} `json:"document" binding:"required"`
}

func (h *InventoryHandler) ListFloorPlanSites(c *gin.Context) {
	tenantID := h.getEffectiveTenantID(c)

	rows, err := h.db.Query(
		c.Request.Context(),
		`SELECT
			s.id::text,
			s.name,
			COALESCE(cl.company_name, ''),
			s.address,
			s.city,
			s.state,
			COUNT(DISTINCT cam.id)::int AS camera_count,
			COUNT(DISTINCT nvr.id)::int AS nvr_count,
			(fp.id IS NOT NULL) AS has_floor_plan,
			fp.name,
			fp.updated_at
		FROM policies.sites s
		LEFT JOIN policies.clients cl
			ON cl.id = s.client_id
		LEFT JOIN inventory.cameras cam
			ON cam.site_id = s.id
			AND cam.tenant_id = s.tenant_id
		LEFT JOIN inventory.nvr_servers nvr
			ON nvr.site_id = s.id
			AND nvr.tenant_id = s.tenant_id
		LEFT JOIN inventory.floor_plans fp
			ON fp.site_id = s.id
			AND fp.tenant_id = s.tenant_id
		WHERE s.tenant_id = $1::uuid
			AND s.is_active = true
		GROUP BY s.id, s.name, cl.company_name, s.address, s.city, s.state, fp.id, fp.name, fp.updated_at
		ORDER BY s.name`,
		tenantID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch floor plan sites"})
		return
	}
	defer rows.Close()

	items := make([]floorPlanSiteListItem, 0)
	for rows.Next() {
		var item floorPlanSiteListItem
		var clientName string
		var updatedAt *time.Time
		if err := rows.Scan(
			&item.ID,
			&item.Name,
			&clientName,
			&item.Address,
			&item.City,
			&item.State,
			&item.CameraCount,
			&item.NvrCount,
			&item.HasFloorPlan,
			&item.FloorPlanName,
			&updatedAt,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse floor plan sites"})
			return
		}
		item.ClientName = clientName
		if updatedAt != nil {
			formatted := updatedAt.Format(time.RFC3339)
			item.UpdatedAt = &formatted
		}
		items = append(items, item)
	}

	c.JSON(http.StatusOK, items)
}

func (h *InventoryHandler) GetFloorPlanBySite(c *gin.Context) {
	tenantID := h.getEffectiveTenantID(c)
	siteID := c.Param("siteId")

	var response floorPlanSiteDetailResponse
	var floorPlanID *string
	var floorPlanName *string
	var version *int
	var canvasWidth *int
	var canvasHeight *int
	var gridSize *int
	var backgroundFileID *string
	var documentJSON []byte
	var createdAt *time.Time
	var updatedAt *time.Time

	err := h.db.QueryRow(
		c.Request.Context(),
		`SELECT
			s.id::text,
			s.name,
			COALESCE(cl.company_name, ''),
			s.address,
			s.city,
			s.state,
			COALESCE(cam.camera_count, 0)::int,
			COALESCE(nvr.nvr_count, 0)::int,
			fp.id::text,
			fp.name,
			fp.version,
			fp.canvas_width,
			fp.canvas_height,
			fp.grid_size,
			fp.background_file_id::text,
			fp.document_json,
			fp.created_at,
			fp.updated_at
		FROM policies.sites s
		LEFT JOIN policies.clients cl
			ON cl.id = s.client_id
		LEFT JOIN (
			SELECT site_id, COUNT(*) AS camera_count
			FROM inventory.cameras
			WHERE tenant_id = $2::uuid
			GROUP BY site_id
		) cam ON cam.site_id = s.id
		LEFT JOIN (
			SELECT site_id, COUNT(*) AS nvr_count
			FROM inventory.nvr_servers
			WHERE tenant_id = $2::uuid
			GROUP BY site_id
		) nvr ON nvr.site_id = s.id
		LEFT JOIN inventory.floor_plans fp
			ON fp.site_id = s.id
			AND fp.tenant_id = s.tenant_id
		WHERE s.id = $1::uuid
			AND s.tenant_id = $2::uuid
			AND s.is_active = true
		LIMIT 1`,
		siteID,
		tenantID,
	).Scan(
		&response.Site.ID,
		&response.Site.Name,
		&response.Site.ClientName,
		&response.Site.Address,
		&response.Site.City,
		&response.Site.State,
		&response.Site.CameraCount,
		&response.Site.NvrCount,
		&floorPlanID,
		&floorPlanName,
		&version,
		&canvasWidth,
		&canvasHeight,
		&gridSize,
		&backgroundFileID,
		&documentJSON,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "site not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch floor plan"})
		return
	}

	if floorPlanID != nil {
		doc := map[string]interface{}{}
		if len(documentJSON) > 0 {
			if err := json.Unmarshal(documentJSON, &doc); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse floor plan document"})
				return
			}
		}
		if backgroundFileID != nil {
			publicURL := buildAbsoluteURL(c, "/api/v1/storage/public/"+*backgroundFileID)
			bg, ok := doc["backgroundImage"].(map[string]interface{})
			if !ok {
				bg = map[string]interface{}{}
			}
			bg["url"] = publicURL
			doc["backgroundImage"] = bg
		}
		response.FloorPlan = &floorPlanRecord{
			ID:               *floorPlanID,
			SiteID:           response.Site.ID,
			Name:             floorPlanStringValue(floorPlanName),
			Version:          floorPlanIntValue(version, 1),
			CanvasWidth:      floorPlanIntValue(canvasWidth, 1200),
			CanvasHeight:     floorPlanIntValue(canvasHeight, 800),
			GridSize:         floorPlanIntValue(gridSize, 20),
			BackgroundFileID: backgroundFileID,
			Document:         doc,
			CreatedAt:        floorPlanTimeValue(createdAt),
			UpdatedAt:        floorPlanTimeValue(updatedAt),
		}
	}

	c.JSON(http.StatusOK, response)
}

func (h *InventoryHandler) SaveFloorPlanBySite(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	userID := middleware.GetUserID(c)
	siteID := c.Param("siteId")

	var req saveFloorPlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	siteExists := false
	if err := h.db.QueryRow(
		c.Request.Context(),
		`SELECT EXISTS(
			SELECT 1
			FROM policies.sites
			WHERE id = $1::uuid
				AND tenant_id = $2::uuid
				AND is_active = true
		)`,
		siteID,
		tenantID,
	).Scan(&siteExists); err != nil || !siteExists {
		c.JSON(http.StatusNotFound, gin.H{"error": "site not found"})
		return
	}

	documentJSON, err := json.Marshal(req.Document)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid floor plan document"})
		return
	}

	var saved floorPlanRecord
	var backgroundFileID *string
	err = h.db.QueryRow(
		c.Request.Context(),
		`INSERT INTO inventory.floor_plans (
			tenant_id,
			site_id,
			name,
			version,
			canvas_width,
			canvas_height,
			grid_size,
			background_file_id,
			document_json,
			created_by,
			updated_by
		) VALUES (
			$1::uuid,
			$2::uuid,
			$3,
			$4,
			$5,
			$6,
			$7,
			$8::uuid,
			$9::jsonb,
			NULLIF($10, '')::uuid,
			NULLIF($10, '')::uuid
		)
		ON CONFLICT (tenant_id, site_id)
		DO UPDATE SET
			name = EXCLUDED.name,
			version = EXCLUDED.version,
			canvas_width = EXCLUDED.canvas_width,
			canvas_height = EXCLUDED.canvas_height,
			grid_size = EXCLUDED.grid_size,
			background_file_id = EXCLUDED.background_file_id,
			document_json = EXCLUDED.document_json,
			updated_by = NULLIF($10, '')::uuid,
			updated_at = CURRENT_TIMESTAMP
		RETURNING
			id::text,
			site_id::text,
			name,
			version,
			canvas_width,
			canvas_height,
			grid_size,
			background_file_id::text,
			document_json,
			created_at,
			updated_at`,
		tenantID,
		siteID,
		req.Name,
		floorPlanMaxInt(req.Version, 1),
		req.CanvasWidth,
		req.CanvasHeight,
		req.GridSize,
		normalizeOptionalString(req.BackgroundFileID),
		documentJSON,
		userID,
	).Scan(
		&saved.ID,
		&saved.SiteID,
		&saved.Name,
		&saved.Version,
		&saved.CanvasWidth,
		&saved.CanvasHeight,
		&saved.GridSize,
		&backgroundFileID,
		&documentJSON,
		&saved.CreatedAt,
		&saved.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save floor plan"})
		return
	}

	saved.BackgroundFileID = backgroundFileID
	saved.Document = map[string]interface{}{}
	if err := json.Unmarshal(documentJSON, &saved.Document); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse saved floor plan"})
		return
	}
	if backgroundFileID != nil {
		bg, ok := saved.Document["backgroundImage"].(map[string]interface{})
		if !ok {
			bg = map[string]interface{}{}
		}
		bg["url"] = buildAbsoluteURL(c, "/api/v1/storage/public/"+*backgroundFileID)
		saved.Document["backgroundImage"] = bg
	}

	c.JSON(http.StatusOK, saved)
}

func floorPlanStringValue(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func floorPlanIntValue(value *int, fallback int) int {
	if value == nil {
		return fallback
	}
	return *value
}

func floorPlanTimeValue(value *time.Time) string {
	if value == nil {
		return ""
	}
	return value.Format(time.RFC3339)
}

func floorPlanMaxInt(value int, fallback int) int {
	if value < fallback {
		return fallback
	}
	return value
}
