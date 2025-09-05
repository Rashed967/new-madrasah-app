
import { Markaz } from '../types';

export const mockMarkazes: Markaz[] = [
  {
    id: 'MK001',
    nameBn: 'দারুল উলুম হাটহাজারী কেন্দ্র',
    markazCode: 10001, // Changed from 'CTG-N-01' to match host madrasa M001's code
    hostMadrasaId: 'M001', 
    // affiliatedMadrasaIds: ['M003', 'M004'], // This field was removed from Markaz type
    zoneId: 'Z001', 
    examineeCapacity: 1000,
    isActive: true,
    createdAt: '2024-05-01T10:00:00.000Z', // Added createdAt for consistency
    updatedAt: '2024-05-01T10:00:00.000Z', // Added updatedAt for consistency
  },
  {
    id: 'MK002',
    nameBn: 'জামিয়া রাহমানিয়া ঢাকা কেন্দ্র',
    markazCode: 10003, // Changed from 'DHK-C-05' to match host madrasa M003's code
    hostMadrasaId: 'M003', 
    // affiliatedMadrasaIds: ['M001'], 
    zoneId: 'Z001', 
    examineeCapacity: 800,
    isActive: true,
    createdAt: '2024-05-10T12:30:00.000Z',
    updatedAt: '2024-05-10T12:30:00.000Z',
  },
  {
    id: 'MK003',
    nameBn: 'আল জামিয়াতুল আহলিয়া পটিয়া কেন্দ্র',
    markazCode: 10002, // Changed from 'CTG-S-02' to match host madrasa M002's code
    hostMadrasaId: 'M002', 
    // affiliatedMadrasaIds: [], 
    zoneId: 'Z002', 
    examineeCapacity: 1200,
    isActive: true, 
    createdAt: '2024-05-15T09:00:00.000Z',
    updatedAt: '2024-05-15T09:00:00.000Z',
  },
];
