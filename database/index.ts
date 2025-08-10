// Main database exports
export { databaseManager } from './database';
export type {
    DatabaseConfig, Image, RecogEvent, Record, Template
} from './database';

// Repository exports
export {
    imagesRepository, ImagesRepository, recogEventsRepository, RecogEventsRepository, recordsRepository, RecordsRepository, templatesRepository, TemplatesRepository
} from './repositories';

// Provider and hooks exports
export {
    DatabaseProvider,
    useDatabase, useDatabaseOperation, useImagesRepository, useRecogEventsRepository, useRecordsRepository, useRepositories,
    useTemplatesRepository
} from './DatabaseProvider';
