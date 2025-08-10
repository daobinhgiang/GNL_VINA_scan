/**
 * Comprehensive types for production form digitization
 * - Excel/Record schema (one row per transaction)
 * - Canonical dimensions
 * - ROI maps (for templates)
 * - Recognition results
 * - Validation states
 * - Database row structures (SQLite)
 */

// =========
// General
// =========

/** ISO date string in format YYYY-MM-DD. */
export type ISODate = string;
/** 24-hour time string in format HH:mm. */
export type ISOHourMinute = string;
/** ISO timestamp string. */
export type ISOTimestamp = string;

/** Millimeters. Integers are expected for canonicalized dimensions. */
export type Millimeter = number;

/** Canonical dimensions in millimeters. */
export interface DimensionsMm {
  lengthL: Millimeter; // L
  widthW: Millimeter;  // W
  thicknessT: Millimeter; // T
}

/** Canonical dimension string representation L×W×T (multiplication sign). */
export type DimensionsString = `${number}×${number}×${number}`;

/** Canonicalized dimensions bundle. */
export interface CanonicalDimensions {
  mm: DimensionsMm;
  asString: DimensionsString;
}

/** Configurable list placeholders. Keep as string to allow runtime-config values. */
export type FormType = string;
export type ProductType = string; // Excel calls this product_type; DB uses model_code

// ==============================
// Excel / Record schema (1 row)
// ==============================

/**
 * One transaction row as exported to Excel (columns 1..17 in order).
 * All dimensions are canonicalized integers in mm.
 */
export interface ExcelTransactionRow {
  // 1-5
  date: ISODate;                   // YYYY-MM-DD
  hour: ISOHourMinute;             // HH:mm 24h
  site: string;
  form_type: FormType;             // configurable list
  product_type: ProductType;       // configurable list

  // 6-9 (input)
  input_L_mm: Millimeter;
  input_W_mm: Millimeter;
  input_T_mm: Millimeter;
  input_count: number;

  // 10-13 (output)
  output_L_mm: Millimeter;
  output_W_mm: Millimeter;
  output_T_mm: Millimeter;
  output_count: number;

  // 14-17 (QC and misc)
  qc_ok: number;                   // hard gate with qc_ng
  qc_ng: number;                   // hard gate with qc_ok
  notes: string | null;
  img_ref: string | null;          // external or internal reference
}

/**
 * Form state used in UI. Allows partial while editing, but keeps types for validation.
 */
export interface TransactionFormData {
  date?: ISODate;
  hour?: ISOHourMinute;
  site?: string;
  form_type?: FormType;
  product_type?: ProductType;

  input_L_mm?: Millimeter;
  input_W_mm?: Millimeter;
  input_T_mm?: Millimeter;
  input_count?: number;

  output_L_mm?: Millimeter;
  output_W_mm?: Millimeter;
  output_T_mm?: Millimeter;
  output_count?: number;

  qc_ok?: number;
  qc_ng?: number;
  notes?: string | null;
  img_ref?: string | null;
}

/** Optional derived fields convenient for UI. Not persisted as columns. */
export interface TransactionDerivedFields {
  input_dimensions?: CanonicalDimensions;
  output_dimensions?: CanonicalDimensions;
}

export type TransactionFormState = TransactionFormData & TransactionDerivedFields;

// =====================
// Validation structures
// =====================

export type ValidationSeverity = 'error' | 'warning' | 'info';

export type TransactionFieldKey = keyof TransactionFormData;

export interface ValidationIssue {
  field?: TransactionFieldKey | 'row' | 'excel';
  code:
    | 'REQUIRED'
    | 'NON_NEGATIVE'
    | 'INTEGER_REQUIRED'
    | 'FORMAT'
    | 'RANGE'
    | 'SUM_MISMATCH' // qc_ok + qc_ng !== output_count
    | 'INCONSISTENT_DIMENSIONS'
    | 'UNKNOWN';
  message: string;
  severity: ValidationSeverity;
}

export interface ValidationState {
  isValid: boolean;          // no error-level issues
  hardGatePassed: boolean;   // qc_ok + qc_ng = output_count
  issues: ValidationIssue[];
}

// ==========
// ROI maps
// ==========

/** Coordinate space for ROIs. */
export type CoordinateSpace = 'pixel' | 'relative'; // relative ∈ [0..1]

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateSpace: CoordinateSpace;
}

export interface RoiPoint {
  x: number;
  y: number;
  coordinateSpace: CoordinateSpace;
}

export type RoiTarget = 'ocr' | 'barcode' | 'checkbox' | 'signature' | 'photo' | 'textfield';

export type RoiValueType =
  | 'string'
  | 'number'
  | 'integer'
  | 'date'
  | 'time'
  | 'select'
  | 'dimension'
  | 'count'
  | 'boolean';

export interface RoiBase {
  id: string;                 // ROI id
  fieldId: string;            // logical field key (e.g., 'product_type')
  label?: string;
  target: RoiTarget;
  valueType: RoiValueType;
  required?: boolean;
}

export interface RoiRect extends RoiBase {
  type: 'rect';
  rect: BBox;
  rotationDeg?: number;       // optional skew/rotation
}

export interface RoiPolygon extends RoiBase {
  type: 'polygon';
  points: RoiPoint[];         // in order
  bbox?: BBox;                // optional bounding box cache
}

export type RoiRegion = RoiRect | RoiPolygon;

export interface RoiMapMeta {
  templateId: string;
  version: string;
  imageSize?: { width: number; height: number };
}

export interface RoiMap extends RoiMapMeta {
  regions: RoiRegion[];
}

// ======================
// Recognition structures
// ======================

export interface OcrToken {
  text: string;
  bbox: BBox;
  confidence: number; // 0..1
}

export interface FieldRecognition<TValue = unknown> {
  fieldId: string;
  roiId?: string;
  rawText?: string;
  value?: TValue;
  confidence?: number;     // 0..1 aggregated
  tokens?: OcrToken[];
  corrected?: boolean;     // set true if human corrected
  provider?: string;       // e.g., 'mlkit', 'tesseract'
}

export interface ImageRecognitionResult {
  imageId: string;
  templateId?: string;
  createdAt: ISOTimestamp;
  fields: Record<string, FieldRecognition<any>>; // key = fieldId
}

// ======================
// Database row structures
// ======================

/** Mirrors SQLite 'templates' table. */
export interface DbTemplateRow {
  template_id: string;
  version: string;
  roi_map_json: string; // serialized RoiMap
}

/** Mirrors SQLite 'images' table. */
export interface DbImageRow {
  img_id: string;
  uri: string;
  rectified_uri?: string | null;
  template_id?: string | null;
  homography?: string | null; // JSON stringified matrix
  blur?: number | null;
  glare?: number | null;
  created_at: ISOTimestamp;
}

/** Mirrors SQLite 'records' table (note: DB uses model_code while Excel uses product_type). */
export interface DbRecordRow {
  id?: number;
  date?: ISODate | null;
  hour?: ISOHourMinute | null;
  site?: string | null;
  form_type?: FormType | null;
  model_code?: string | null; // corresponds to Excel product_type
  input_L_mm?: Millimeter | null;
  input_W_mm?: Millimeter | null;
  input_T_mm?: Millimeter | null;
  input_count?: number | null;
  output_L_mm?: Millimeter | null;
  output_W_mm?: Millimeter | null;
  output_T_mm?: Millimeter | null;
  output_count?: number | null;
  qc_ok?: number | null;
  qc_ng?: number | null;
  operator_id?: string | null;
  batch_no?: string | null;
  line_id?: string | null;
  notes?: string | null;
  img_ref?: string | null;
  source_img_id?: string | null;
  model_version?: string | null;
  verified?: 0 | 1 | null; // integer flag
  created_at: ISOTimestamp;
}

/** Mirrors SQLite 'recog_events' table. */
export interface DbRecogEventRow {
  id?: number;
  img_id?: string | null;
  field_id?: string | null;      // fieldId from ROI map
  raw_text?: string | null;
  value?: string | null;
  conf?: number | null;          // 0..1
  corrected?: 0 | 1 | null;      // integer flag
  created_at?: ISOTimestamp | null;
}

// ======================
// Mappings / helpers (types only)
// ======================

/** Mapping between Excel row and DB record columns. */
export interface ExcelDbMapping {
  product_type_to_model_code: true; // Excel.product_type -> records.model_code
  img_ref_column: 'img_ref';        // Excel.img_ref -> records.img_ref
}

/** Strongly-typed container for a validated row ready for persistence. */
export interface PersistableTransactionRow {
  excel: ExcelTransactionRow;
  validation: ValidationState;
  dbRow: Omit<DbRecordRow, 'id'>;   // prepared row for insert
}

