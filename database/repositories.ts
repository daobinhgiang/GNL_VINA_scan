import { databaseManager, Image, RecogEvent, Record, Template } from './database';

// Templates Repository
export class TemplatesRepository {
  async create(template: Template): Promise<void> {
    const query = `
      INSERT INTO templates (template_id, version, roi_map_json)
      VALUES (?, ?, ?)
    `;
    await databaseManager.executeUpdate(query, [
      template.template_id,
      template.version,
      template.roi_map_json
    ]);
  }

  async findById(templateId: string): Promise<Template | null> {
    const query = 'SELECT * FROM templates WHERE template_id = ?';
    const results = await databaseManager.executeQuery<Template>(query, [templateId]);
    return results.length > 0 ? results[0] : null;
  }

  async findAll(): Promise<Template[]> {
    const query = 'SELECT * FROM templates ORDER BY template_id';
    return await databaseManager.executeQuery<Template>(query);
  }

  async update(template: Template): Promise<void> {
    const query = `
      UPDATE templates 
      SET version = ?, roi_map_json = ?
      WHERE template_id = ?
    `;
    await databaseManager.executeUpdate(query, [
      template.version,
      template.roi_map_json,
      template.template_id
    ]);
  }

  async delete(templateId: string): Promise<void> {
    const query = 'DELETE FROM templates WHERE template_id = ?';
    await databaseManager.executeUpdate(query, [templateId]);
  }

  async findByVersion(version: string): Promise<Template[]> {
    const query = 'SELECT * FROM templates WHERE version = ?';
    return await databaseManager.executeQuery<Template>(query, [version]);
  }
}

// Images Repository
export class ImagesRepository {
  async create(image: Image): Promise<void> {
    const query = `
      INSERT INTO images (img_id, uri, rectified_uri, template_id, homography, blur, glare, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await databaseManager.executeUpdate(query, [
      image.img_id,
      image.uri,
      image.rectified_uri || null,
      image.template_id || null,
      image.homography || null,
      image.blur || null,
      image.glare || null,
      image.created_at
    ]);
  }

  async findById(imgId: string): Promise<Image | null> {
    const query = 'SELECT * FROM images WHERE img_id = ?';
    const results = await databaseManager.executeQuery<Image>(query, [imgId]);
    return results.length > 0 ? results[0] : null;
  }

  async findAll(): Promise<Image[]> {
    const query = 'SELECT * FROM images ORDER BY created_at DESC';
    return await databaseManager.executeQuery<Image>(query);
  }

  async findByTemplateId(templateId: string): Promise<Image[]> {
    const query = 'SELECT * FROM images WHERE template_id = ? ORDER BY created_at DESC';
    return await databaseManager.executeQuery<Image>(query, [templateId]);
  }

  async update(image: Image): Promise<void> {
    const query = `
      UPDATE images 
      SET uri = ?, rectified_uri = ?, template_id = ?, homography = ?, blur = ?, glare = ?
      WHERE img_id = ?
    `;
    await databaseManager.executeUpdate(query, [
      image.uri,
      image.rectified_uri || null,
      image.template_id || null,
      image.homography || null,
      image.blur || null,
      image.glare || null,
      image.img_id
    ]);
  }

  async delete(imgId: string): Promise<void> {
    const query = 'DELETE FROM images WHERE img_id = ?';
    await databaseManager.executeUpdate(query, [imgId]);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Image[]> {
    const query = 'SELECT * FROM images WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC';
    return await databaseManager.executeQuery<Image>(query, [startDate, endDate]);
  }

  async findWithQualityIssues(blurThreshold?: number, glareThreshold?: number): Promise<Image[]> {
    let query = 'SELECT * FROM images WHERE ';
    const params: any[] = [];
    const conditions: string[] = [];

    if (blurThreshold !== undefined) {
      conditions.push('blur > ?');
      params.push(blurThreshold);
    }

    if (glareThreshold !== undefined) {
      conditions.push('glare > ?');
      params.push(glareThreshold);
    }

    if (conditions.length === 0) {
      query += '(blur IS NOT NULL OR glare IS NOT NULL)';
    } else {
      query += conditions.join(' OR ');
    }

    query += ' ORDER BY created_at DESC';
    return await databaseManager.executeQuery<Image>(query, params);
  }
}

// Records Repository
export class RecordsRepository {
  async create(record: Omit<Record, 'id'>): Promise<number> {
    const query = `
      INSERT INTO records (
        date, hour, site, form_type, model_code,
        input_L_mm, input_W_mm, input_T_mm, input_count,
        output_L_mm, output_W_mm, output_T_mm, output_count,
        qc_ok, qc_ng, operator_id, batch_no, line_id,
        notes, img_ref, source_img_id, model_version, verified, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await databaseManager.executeUpdate(query, [
      record.date || null,
      record.hour || null,
      record.site || null,
      record.form_type || null,
      record.model_code || null,
      record.input_L_mm || null,
      record.input_W_mm || null,
      record.input_T_mm || null,
      record.input_count || null,
      record.output_L_mm || null,
      record.output_W_mm || null,
      record.output_T_mm || null,
      record.output_count || null,
      record.qc_ok || null,
      record.qc_ng || null,
      record.operator_id || null,
      record.batch_no || null,
      record.line_id || null,
      record.notes || null,
      record.img_ref || null,
      record.source_img_id || null,
      record.model_version || null,
      record.verified || 0,
      record.created_at
    ]);
    return result.lastInsertRowId;
  }

  async findById(id: number): Promise<Record | null> {
    const query = 'SELECT * FROM records WHERE id = ?';
    const results = await databaseManager.executeQuery<Record>(query, [id]);
    return results.length > 0 ? results[0] : null;
  }

  async findAll(limit?: number, offset?: number): Promise<Record[]> {
    let query = 'SELECT * FROM records ORDER BY created_at DESC';
    const params: any[] = [];

    if (limit !== undefined) {
      query += ' LIMIT ?';
      params.push(limit);
      
      if (offset !== undefined) {
        query += ' OFFSET ?';
        params.push(offset);
      }
    }

    return await databaseManager.executeQuery<Record>(query, params);
  }

  async findBySourceImageId(sourceImgId: string): Promise<Record[]> {
    const query = 'SELECT * FROM records WHERE source_img_id = ? ORDER BY created_at DESC';
    return await databaseManager.executeQuery<Record>(query, [sourceImgId]);
  }

  async findByOperator(operatorId: string): Promise<Record[]> {
    const query = 'SELECT * FROM records WHERE operator_id = ? ORDER BY created_at DESC';
    return await databaseManager.executeQuery<Record>(query, [operatorId]);
  }

  async findByBatchNo(batchNo: string): Promise<Record[]> {
    const query = 'SELECT * FROM records WHERE batch_no = ? ORDER BY created_at DESC';
    return await databaseManager.executeQuery<Record>(query, [batchNo]);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Record[]> {
    const query = 'SELECT * FROM records WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC';
    return await databaseManager.executeQuery<Record>(query, [startDate, endDate]);
  }

  async findUnverified(): Promise<Record[]> {
    const query = 'SELECT * FROM records WHERE verified = 0 ORDER BY created_at DESC';
    return await databaseManager.executeQuery<Record>(query);
  }

  async update(id: number, record: Partial<Record>): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    Object.entries(record).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (fields.length === 0) return;

    const query = `UPDATE records SET ${fields.join(', ')} WHERE id = ?`;
    params.push(id);
    await databaseManager.executeUpdate(query, params);
  }

  async markAsVerified(id: number): Promise<void> {
    const query = 'UPDATE records SET verified = 1 WHERE id = ?';
    await databaseManager.executeUpdate(query, [id]);
  }

  async delete(id: number): Promise<void> {
    const query = 'DELETE FROM records WHERE id = ?';
    await databaseManager.executeUpdate(query, [id]);
  }

  async getStatsByDateRange(startDate: string, endDate: string): Promise<{
    total_records: number;
    verified_records: number;
    total_qc_ok: number;
    total_qc_ng: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as verified_records,
        SUM(COALESCE(qc_ok, 0)) as total_qc_ok,
        SUM(COALESCE(qc_ng, 0)) as total_qc_ng
      FROM records 
      WHERE created_at BETWEEN ? AND ?
    `;
    const results = await databaseManager.executeQuery(query, [startDate, endDate]);
    return results[0] || { total_records: 0, verified_records: 0, total_qc_ok: 0, total_qc_ng: 0 };
  }
}

// Recognition Events Repository
export class RecogEventsRepository {
  async create(event: Omit<RecogEvent, 'id'>): Promise<number> {
    const query = `
      INSERT INTO recog_events (img_id, field_id, raw_text, value, conf, corrected, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await databaseManager.executeUpdate(query, [
      event.img_id || null,
      event.field_id || null,
      event.raw_text || null,
      event.value || null,
      event.conf || null,
      event.corrected || 0,
      event.created_at || new Date().toISOString()
    ]);
    return result.lastInsertRowId;
  }

  async findById(id: number): Promise<RecogEvent | null> {
    const query = 'SELECT * FROM recog_events WHERE id = ?';
    const results = await databaseManager.executeQuery<RecogEvent>(query, [id]);
    return results.length > 0 ? results[0] : null;
  }

  async findByImageId(imgId: string): Promise<RecogEvent[]> {
    const query = 'SELECT * FROM recog_events WHERE img_id = ? ORDER BY created_at DESC';
    return await databaseManager.executeQuery<RecogEvent>(query, [imgId]);
  }

  async findByFieldId(fieldId: string): Promise<RecogEvent[]> {
    const query = 'SELECT * FROM recog_events WHERE field_id = ? ORDER BY created_at DESC';
    return await databaseManager.executeQuery<RecogEvent>(query, [fieldId]);
  }

  async findAll(limit?: number, offset?: number): Promise<RecogEvent[]> {
    let query = 'SELECT * FROM recog_events ORDER BY created_at DESC';
    const params: any[] = [];

    if (limit !== undefined) {
      query += ' LIMIT ?';
      params.push(limit);
      
      if (offset !== undefined) {
        query += ' OFFSET ?';
        params.push(offset);
      }
    }

    return await databaseManager.executeQuery<RecogEvent>(query, params);
  }

  async findLowConfidence(threshold: number = 0.8): Promise<RecogEvent[]> {
    const query = 'SELECT * FROM recog_events WHERE conf < ? ORDER BY conf ASC';
    return await databaseManager.executeQuery<RecogEvent>(query, [threshold]);
  }

  async findCorrected(): Promise<RecogEvent[]> {
    const query = 'SELECT * FROM recog_events WHERE corrected = 1 ORDER BY created_at DESC';
    return await databaseManager.executeQuery<RecogEvent>(query);
  }

  async update(id: number, event: Partial<RecogEvent>): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    Object.entries(event).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (fields.length === 0) return;

    const query = `UPDATE recog_events SET ${fields.join(', ')} WHERE id = ?`;
    params.push(id);
    await databaseManager.executeUpdate(query, params);
  }

  async markAsCorrected(id: number, correctedValue?: string): Promise<void> {
    const query = correctedValue 
      ? 'UPDATE recog_events SET corrected = 1, value = ? WHERE id = ?'
      : 'UPDATE recog_events SET corrected = 1 WHERE id = ?';
    const params = correctedValue ? [correctedValue, id] : [id];
    await databaseManager.executeUpdate(query, params);
  }

  async delete(id: number): Promise<void> {
    const query = 'DELETE FROM recog_events WHERE id = ?';
    await databaseManager.executeUpdate(query, [id]);
  }

  async deleteByImageId(imgId: string): Promise<void> {
    const query = 'DELETE FROM recog_events WHERE img_id = ?';
    await databaseManager.executeUpdate(query, [imgId]);
  }

  async getConfidenceStats(): Promise<{
    avg_confidence: number;
    min_confidence: number;
    max_confidence: number;
    total_events: number;
    corrected_events: number;
  }> {
    const query = `
      SELECT 
        AVG(COALESCE(conf, 0)) as avg_confidence,
        MIN(COALESCE(conf, 0)) as min_confidence,
        MAX(COALESCE(conf, 0)) as max_confidence,
        COUNT(*) as total_events,
        SUM(CASE WHEN corrected = 1 THEN 1 ELSE 0 END) as corrected_events
      FROM recog_events
    `;
    const results = await databaseManager.executeQuery(query);
    return results[0] || { 
      avg_confidence: 0, 
      min_confidence: 0, 
      max_confidence: 0, 
      total_events: 0, 
      corrected_events: 0 
    };
  }
}

// Repository instances
export const templatesRepository = new TemplatesRepository();
export const imagesRepository = new ImagesRepository();
export const recordsRepository = new RecordsRepository();
export const recogEventsRepository = new RecogEventsRepository();