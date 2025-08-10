import * as SQLite from 'expo-sqlite';

export interface DatabaseConfig {
  name: string;
  version: number;
}

export interface Template {
  template_id: string;
  version: string;
  roi_map_json: string;
}

export interface Image {
  img_id: string;
  uri: string;
  rectified_uri?: string;
  template_id?: string;
  homography?: string;
  blur?: number;
  glare?: number;
  created_at: string;
}

export interface Record {
  id?: number;
  date?: string;
  hour?: string;
  site?: string;
  form_type?: string;
  model_code?: string;
  input_L_mm?: number;
  input_W_mm?: number;
  input_T_mm?: number;
  input_count?: number;
  output_L_mm?: number;
  output_W_mm?: number;
  output_T_mm?: number;
  output_count?: number;
  qc_ok?: number;
  qc_ng?: number;
  operator_id?: string;
  batch_no?: string;
  line_id?: string;
  notes?: string;
  img_ref?: string;
  source_img_id?: string;
  model_version?: string;
  verified?: number;
  created_at: string;
}

export interface RecogEvent {
  id?: number;
  img_id?: string;
  field_id?: string;
  raw_text?: string;
  value?: string;
  conf?: number;
  corrected?: number;
  created_at?: string;
}

class DatabaseManager {
  private db: SQLite.SQLiteDatabase | null = null;
  private config: DatabaseConfig = {
    name: 'gnl_vina_scan.db',
    version: 1
  };

  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(this.config.name);
      await this.runMigrations();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Enable foreign key constraints
      await this.db.execAsync('PRAGMA foreign_keys = ON;');
      
      // Create tables
      await this.createTables();
      
      console.log('Database migrations completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createTemplatesTable = `
      CREATE TABLE IF NOT EXISTS templates(
        template_id TEXT PRIMARY KEY,
        version TEXT NOT NULL,
        roi_map_json TEXT NOT NULL
      );
    `;

    const createImagesTable = `
      CREATE TABLE IF NOT EXISTS images(
        img_id TEXT PRIMARY KEY,
        uri TEXT NOT NULL,
        rectified_uri TEXT,
        template_id TEXT,
        homography TEXT,
        blur REAL, 
        glare REAL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (template_id) REFERENCES templates(template_id)
      );
    `;

    const createRecordsTable = `
      CREATE TABLE IF NOT EXISTS records(
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
      );
    `;

    const createRecogEventsTable = `
      CREATE TABLE IF NOT EXISTS recog_events(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        img_id TEXT, 
        field_id TEXT, 
        raw_text TEXT, 
        value TEXT, 
        conf REAL, 
        corrected INTEGER DEFAULT 0, 
        created_at TEXT,
        FOREIGN KEY (img_id) REFERENCES images(img_id)
      );
    `;

    // Create indexes for better performance
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_images_template_id ON images(template_id);',
      'CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_records_source_img_id ON records(source_img_id);',
      'CREATE INDEX IF NOT EXISTS idx_records_created_at ON records(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_recog_events_img_id ON recog_events(img_id);',
      'CREATE INDEX IF NOT EXISTS idx_recog_events_created_at ON recog_events(created_at);'
    ];

    try {
      await this.db.execAsync(createTemplatesTable);
      await this.db.execAsync(createImagesTable);
      await this.db.execAsync(createRecordsTable);
      await this.db.execAsync(createRecogEventsTable);
      
      // Create indexes
      for (const indexQuery of createIndexes) {
        await this.db.execAsync(indexQuery);
      }
      
      console.log('All tables and indexes created successfully');
    } catch (error) {
      console.error('Failed to create tables:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      console.log('Database connection closed');
    }
  }

  getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  async executeQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
    const db = this.getDatabase();
    try {
      const result = params !== undefined
        ? await db.getAllAsync(query, params)
        : await db.getAllAsync(query);
      return result as T[];
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  async executeUpdate(query: string, params?: any[]): Promise<SQLite.SQLiteRunResult> {
    const db = this.getDatabase();
    try {
      const result = params !== undefined
        ? await db.runAsync(query, params)
        : await db.runAsync(query);
      return result;
    } catch (error) {
      console.error('Update execution failed:', error);
      throw error;
    }
  }
}

// Singleton instance
export const databaseManager = new DatabaseManager();