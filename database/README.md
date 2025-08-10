# Database Module

This module provides SQLite database functionality for the GNL VINA Scan React Native application.

## Overview

The database module includes:
- **Database initialization and migration handling**
- **Four main tables**: `templates`, `images`, `records`, `recog_events`
- **CRUD operations** for all tables
- **React Context provider** for easy access throughout the app
- **Utility functions** for data validation and manipulation

## Tables Schema

### Templates
Stores template information for image processing:
```sql
CREATE TABLE templates(
  template_id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  roi_map_json TEXT NOT NULL
);
```

### Images
Stores image metadata and processing information:
```sql
CREATE TABLE images(
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
```

### Records
Stores form recognition results and measurements:
```sql
CREATE TABLE records(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT, hour TEXT, site TEXT, form_type TEXT, model_code TEXT,
  input_L_mm INTEGER, input_W_mm INTEGER, input_T_mm INTEGER, input_count INTEGER,
  output_L_mm INTEGER, output_W_mm INTEGER, output_T_mm INTEGER, output_count INTEGER,
  qc_ok INTEGER, qc_ng INTEGER,
  operator_id TEXT, batch_no TEXT, line_id TEXT,
  notes TEXT, img_ref TEXT,
  source_img_id TEXT, model_version TEXT, verified INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (source_img_id) REFERENCES images(img_id)
);
```

### Recognition Events
Stores OCR/recognition events and results:
```sql
CREATE TABLE recog_events(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  img_id TEXT, field_id TEXT, raw_text TEXT, value TEXT, conf REAL, 
  corrected INTEGER DEFAULT 0, created_at TEXT,
  FOREIGN KEY (img_id) REFERENCES images(img_id)
);
```

## Usage

### Setup

The database is automatically initialized when the app starts through the `DatabaseProvider` in `_layout.tsx`.

### Using Repositories

```tsx
import { useRepositories, useDatabase } from '../database';

function MyComponent() {
  const { isReady, isLoading, error } = useDatabase();
  const { templates, images, records, recogEvents } = useRepositories();

  if (isLoading) return <Text>Loading database...</Text>;
  if (error) return <Text>Database error: {error}</Text>;
  if (!isReady) return <Text>Database not ready</Text>;

  // Use repositories here
  const handleCreateTemplate = async () => {
    await templates.create({
      template_id: 'template_1',
      version: '1.0',
      roi_map_json: JSON.stringify({ regions: [] })
    });
  };

  return <View>{/* Your component */}</View>;
}
```

### Individual Repository Hooks

```tsx
import { useTemplatesRepository, useImagesRepository } from '../database';

function TemplateManager() {
  const templatesRepo = useTemplatesRepository();
  
  const loadTemplates = async () => {
    const allTemplates = await templatesRepo.findAll();
    console.log(allTemplates);
  };

  return <View>{/* Your component */}</View>;
}
```

### Database Operations with Error Handling

```tsx
import { useDatabaseOperation } from '../database';

function DataManager() {
  const { execute, loading, error, clearError } = useDatabaseOperation();

  const saveRecord = async (recordData) => {
    const result = await execute(async () => {
      return await recordsRepository.create(recordData);
    });

    if (result) {
      console.log('Record saved with ID:', result);
    }
  };

  return (
    <View>
      {loading && <Text>Saving...</Text>}
      {error && <Text>Error: {error}</Text>}
    </View>
  );
}
```

## Repository Methods

### Templates Repository
- `create(template)` - Create new template
- `findById(id)` - Find template by ID
- `findAll()` - Get all templates
- `findByVersion(version)` - Find templates by version
- `update(template)` - Update template
- `delete(id)` - Delete template

### Images Repository
- `create(image)` - Create new image record
- `findById(id)` - Find image by ID
- `findAll()` - Get all images
- `findByTemplateId(templateId)` - Find images by template
- `findByDateRange(start, end)` - Find images in date range
- `findWithQualityIssues(blur, glare)` - Find images with quality issues
- `update(image)` - Update image
- `delete(id)` - Delete image

### Records Repository
- `create(record)` - Create new record (returns ID)
- `findById(id)` - Find record by ID
- `findAll(limit?, offset?)` - Get all records with pagination
- `findBySourceImageId(imgId)` - Find records by source image
- `findByOperator(operatorId)` - Find records by operator
- `findByBatchNo(batchNo)` - Find records by batch number
- `findByDateRange(start, end)` - Find records in date range
- `findUnverified()` - Find unverified records
- `update(id, record)` - Update record
- `markAsVerified(id)` - Mark record as verified
- `delete(id)` - Delete record
- `getStatsByDateRange(start, end)` - Get statistics

### Recognition Events Repository
- `create(event)` - Create new recognition event (returns ID)
- `findById(id)` - Find event by ID
- `findByImageId(imgId)` - Find events by image
- `findByFieldId(fieldId)` - Find events by field
- `findAll(limit?, offset?)` - Get all events with pagination
- `findLowConfidence(threshold)` - Find low confidence events
- `findCorrected()` - Find corrected events
- `update(id, event)` - Update event
- `markAsCorrected(id, value?)` - Mark event as corrected
- `delete(id)` - Delete event
- `deleteByImageId(imgId)` - Delete all events for an image
- `getConfidenceStats()` - Get confidence statistics

## Utility Functions

The `utils.ts` file provides helper functions:

- `generateImageId()` - Generate unique image ID
- `generateTemplateId()` - Generate unique template ID
- `getCurrentTimestamp()` - Get current ISO timestamp
- `formatDate(iso)` - Format date for display
- `formatDateTime(iso)` - Format datetime for display
- `calculateImageQuality(image)` - Calculate quality score
- `getQualityAssessment(image)` - Get quality text assessment
- `validateRecord(record)` - Validate record data
- `validateImage(image)` - Validate image data
- `validateRecogEvent(event)` - Validate recognition event data
- `parseHomography(string)` - Parse homography matrix
- `stringifyHomography(matrix)` - Stringify homography matrix
- `parseRoiMap(string)` - Parse ROI map JSON
- `getDateRange(days)` - Get date range for queries

## Error Handling

The database module includes comprehensive error handling:

1. **Initialization errors** are caught and exposed through the `useDatabase` hook
2. **Query errors** are logged and thrown for handling in components
3. **Validation functions** help prevent invalid data insertion
4. **The `useDatabaseOperation` hook** provides standardized error handling for operations

## Migration Support

The database automatically handles schema creation and includes:
- Foreign key constraints
- Indexes for performance
- Default values where appropriate

Future migrations can be added to the `runMigrations()` method in the `DatabaseManager` class.

## Performance Considerations

- Indexes are created on frequently queried columns
- Foreign key constraints ensure data integrity
- Pagination support for large result sets
- Connection pooling handled by expo-sqlite

## Best Practices

1. Always check `isReady` before using repositories
2. Use the provided validation functions before inserting data
3. Handle errors appropriately in your components
4. Use pagination for large datasets
5. Close the database connection when the app is terminated (handled automatically)