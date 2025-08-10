import { Image, RecogEvent, Record } from './database';

/**
 * Utility functions for database operations
 */

/**
 * Generate a unique ID for images
 */
export function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique template ID
 */
export function generateTemplateId(): string {
  return `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Format date for display
 */
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString();
}

/**
 * Format datetime for display
 */
export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString();
}

/**
 * Calculate image quality score based on blur and glare
 */
export function calculateImageQuality(image: Image): number {
  if (!image.blur && !image.glare) return 1.0;
  
  const blurScore = image.blur ? Math.max(0, 1 - image.blur) : 1.0;
  const glareScore = image.glare ? Math.max(0, 1 - image.glare) : 1.0;
  
  return Math.min(blurScore, glareScore);
}

/**
 * Get quality assessment text
 */
export function getQualityAssessment(image: Image): 'excellent' | 'good' | 'fair' | 'poor' {
  const quality = calculateImageQuality(image);
  
  if (quality >= 0.9) return 'excellent';
  if (quality >= 0.7) return 'good';
  if (quality >= 0.5) return 'fair';
  return 'poor';
}

/**
 * Calculate recognition confidence statistics
 */
export function calculateConfidenceStats(events: RecogEvent[]): {
  average: number;
  minimum: number;
  maximum: number;
  belowThreshold: number;
  threshold: number;
} {
  const threshold = 0.8;
  const confidences = events
    .map(e => e.conf)
    .filter((conf): conf is number => conf !== undefined && conf !== null);

  if (confidences.length === 0) {
    return {
      average: 0,
      minimum: 0,
      maximum: 0,
      belowThreshold: 0,
      threshold
    };
  }

  const average = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  const minimum = Math.min(...confidences);
  const maximum = Math.max(...confidences);
  const belowThreshold = confidences.filter(conf => conf < threshold).length;

  return {
    average,
    minimum,
    maximum,
    belowThreshold,
    threshold
  };
}

/**
 * Validate record data before insertion
 */
export function validateRecord(record: Partial<Record>): string[] {
  const errors: string[] = [];

  // Check for required fields
  if (!record.created_at) {
    errors.push('created_at is required');
  }

  // Validate numeric fields
  const numericFields = [
    'input_L_mm', 'input_W_mm', 'input_T_mm', 'input_count',
    'output_L_mm', 'output_W_mm', 'output_T_mm', 'output_count',
    'qc_ok', 'qc_ng'
  ];

  numericFields.forEach(field => {
    const value = record[field as keyof Record];
    if (value !== undefined && value !== null && (isNaN(Number(value)) || Number(value) < 0)) {
      errors.push(`${field} must be a non-negative number`);
    }
  });

  // Validate verified field
  if (record.verified !== undefined && ![0, 1].includes(Number(record.verified))) {
    errors.push('verified must be 0 or 1');
  }

  return errors;
}

/**
 * Validate image data before insertion
 */
export function validateImage(image: Partial<Image>): string[] {
  const errors: string[] = [];

  // Check for required fields
  if (!image.img_id) {
    errors.push('img_id is required');
  }

  if (!image.uri) {
    errors.push('uri is required');
  }

  if (!image.created_at) {
    errors.push('created_at is required');
  }

  // Validate numeric fields
  if (image.blur !== undefined && image.blur !== null && (isNaN(Number(image.blur)) || Number(image.blur) < 0)) {
    errors.push('blur must be a non-negative number');
  }

  if (image.glare !== undefined && image.glare !== null && (isNaN(Number(image.glare)) || Number(image.glare) < 0)) {
    errors.push('glare must be a non-negative number');
  }

  return errors;
}

/**
 * Validate recognition event data
 */
export function validateRecogEvent(event: Partial<RecogEvent>): string[] {
  const errors: string[] = [];

  // Validate confidence
  if (event.conf !== undefined && event.conf !== null) {
    const conf = Number(event.conf);
    if (isNaN(conf) || conf < 0 || conf > 1) {
      errors.push('confidence must be between 0 and 1');
    }
  }

  // Validate corrected field
  if (event.corrected !== undefined && ![0, 1].includes(Number(event.corrected))) {
    errors.push('corrected must be 0 or 1');
  }

  return errors;
}

/**
 * Create a backup of the database (returns SQL statements)
 */
export async function createBackupQueries(): Promise<string[]> {
  // This would need to be implemented with actual database queries
  // For now, return the table creation statements
  return [
    `CREATE TABLE IF NOT EXISTS templates(
      template_id TEXT PRIMARY KEY,
      version TEXT NOT NULL,
      roi_map_json TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS images(
      img_id TEXT PRIMARY KEY,
      uri TEXT NOT NULL,
      rectified_uri TEXT,
      template_id TEXT,
      homography TEXT,
      blur REAL, 
      glare REAL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (template_id) REFERENCES templates(template_id)
    );`,
    `CREATE TABLE IF NOT EXISTS records(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT, 
      hour TEXT, 
      site TEXT, 
      form_type TEXT, 
      model_code TEXT,
      input_L_mm INTEGER, 
      input_W_mm INTEGER, 
      input_T_mm INTEGER, 
      input_count INTEGER,
      output_L_mm INTEGER, 
      output_W_mm INTEGER, 
      output_T_mm INTEGER, 
      output_count INTEGER,
      qc_ok INTEGER, 
      qc_ng INTEGER,
      operator_id TEXT, 
      batch_no TEXT, 
      line_id TEXT,
      notes TEXT, 
      img_ref TEXT,
      source_img_id TEXT, 
      model_version TEXT, 
      verified INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (source_img_id) REFERENCES images(img_id)
    );`,
    `CREATE TABLE IF NOT EXISTS recog_events(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      img_id TEXT, 
      field_id TEXT, 
      raw_text TEXT, 
      value TEXT, 
      conf REAL, 
      corrected INTEGER DEFAULT 0, 
      created_at TEXT,
      FOREIGN KEY (img_id) REFERENCES images(img_id)
    );`
  ];
}

/**
 * Parse homography string to matrix
 */
export function parseHomography(homographyString: string | null | undefined): number[][] | null {
  if (!homographyString) return null;
  
  try {
    return JSON.parse(homographyString);
  } catch {
    return null;
  }
}

/**
 * Stringify homography matrix
 */
export function stringifyHomography(matrix: number[][] | null | undefined): string | null {
  if (!matrix) return null;
  
  try {
    return JSON.stringify(matrix);
  } catch {
    return null;
  }
}

/**
 * Parse ROI map JSON
 */
export function parseRoiMap(roiMapString: string): any {
  try {
    return JSON.parse(roiMapString);
  } catch {
    return null;
  }
}

/**
 * Get date range for queries
 */
export function getDateRange(days: number): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
}