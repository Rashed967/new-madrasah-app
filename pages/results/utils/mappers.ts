import { Teacher, TeacherDbRow, Marhala, MarhalaApiResponse, Markaz, MarkazDbRow } from '../../../types';

export const mapDbRowToTeacher = (dbRow: TeacherDbRow): Teacher => ({
    id: dbRow.id,
    teacherCode: dbRow.teacher_code,
    nameBn: dbRow.name_bn,
    nameEn: dbRow.name_en || undefined,
    mobile: dbRow.mobile,
    nidNumber: dbRow.nid_number,
    email: dbRow.email || undefined,
    dateOfBirth: dbRow.date_of_birth,
    gender: dbRow.gender,
    photoUrl: dbRow.photo_url || undefined,
    paymentInfo: dbRow.payment_info || undefined,
    addressDetails: dbRow.address_details || undefined,
    educationalQualification: dbRow.educational_qualification,
    kitabiQualification: dbRow.kitabi_qualification || [],
    expertiseAreas: dbRow.expertise_areas || undefined,
    notes: dbRow.notes || undefined,
isActive: dbRow.is_active,
    registeredBy: dbRow.registered_by || undefined,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
});

export const mapApiMarhalaToFrontend = (apiMarhala: MarhalaApiResponse): Marhala => ({
  id: apiMarhala.id, marhala_code: apiMarhala.marhala_code, nameBn: apiMarhala.name_bn,
  nameAr: apiMarhala.name_ar || undefined, type: apiMarhala.type, category: apiMarhala.category,
  kitabIds: apiMarhala.kitab_ids || [], marhala_order: apiMarhala.marhala_order,
  requiresPhoto: apiMarhala.requires_photo || false, createdAt: apiMarhala.created_at, updatedAt: apiMarhala.updated_at, 
});

export const mapMarkazDbRowToFrontend = (dbRow: MarkazDbRow): Markaz => ({
    id: dbRow.id, nameBn: dbRow.name_bn, markazCode: dbRow.markaz_code, hostMadrasaId: dbRow.host_madrasa_id,
    zoneId: dbRow.zone_id, examineeCapacity: dbRow.examinee_capacity, isActive: dbRow.is_active,
    createdAt: dbRow.created_at, updatedAt: dbRow.updated_at
});
