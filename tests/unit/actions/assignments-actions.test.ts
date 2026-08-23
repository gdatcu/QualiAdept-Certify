import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  toggleAssignmentStatus,
  togglePublishStatus,
} from '@/app/actions/assignments';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    assignment: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    submission: {
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  getAuthSession: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Assignment Server Actions Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAssignment', () => {
    it('throws error if user is not authenticated or not a trainer', async () => {
      vi.mocked(getAuthSession).mockResolvedValueOnce(null);

      const formData = new FormData();
      await expect(createAssignment(formData)).rejects.toThrow('Unauthorized: Trainer access required.');
    });

    it('throws error if required fields are missing', async () => {
      vi.mocked(getAuthSession).mockResolvedValueOnce({
        user: { id: 't-1', role: 'TRAINER' },
      } as any);

      const formData = new FormData();
      formData.append('title', 'HTML Basics');
      // missing module, description, validationType

      await expect(createAssignment(formData)).rejects.toThrow('All fields');
    });

    it('throws error if module is not a positive integer', async () => {
      vi.mocked(getAuthSession).mockResolvedValueOnce({
        user: { id: 't-1', role: 'TRAINER' },
      } as any);

      const formData = new FormData();
      formData.append('title', 'Test');
      formData.append('description', 'Desc');
      formData.append('module', 'invalid');
      formData.append('validationType', 'STATIC');

      await expect(createAssignment(formData)).rejects.toThrow('Module number must be a non-negative integer');
    });

    it('throws error if validation rules JSON is malformed', async () => {
      vi.mocked(getAuthSession).mockResolvedValueOnce({
        user: { id: 't-1', role: 'TRAINER' },
      } as any);

      const formData = new FormData();
      formData.append('title', 'Test');
      formData.append('description', 'Desc');
      formData.append('module', '1');
      formData.append('validationType', 'STATIC');
      formData.append('validationRules', '{ invalid json ');

      await expect(createAssignment(formData)).rejects.toThrow('Invalid JSON format in Validation Rules.');
    });

    it('throws error if module already exists', async () => {
      vi.mocked(getAuthSession).mockResolvedValueOnce({
        user: { id: 't-1', role: 'TRAINER' },
      } as any);

      vi.mocked(prisma.assignment.findFirst).mockResolvedValueOnce({
        id: 'existing-1',
        title: 'Existing Module',
      } as any);

      const formData = new FormData();
      formData.append('title', 'Test');
      formData.append('description', 'Desc');
      formData.append('module', '1');
      formData.append('validationType', 'STATIC');

      await expect(createAssignment(formData)).rejects.toThrow('already exists');
    });

    it('creates assignment successfully when inputs are valid', async () => {
      vi.mocked(getAuthSession).mockResolvedValueOnce({
        user: { id: 't-1', role: 'TRAINER' },
      } as any);

      vi.mocked(prisma.assignment.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.assignment.create).mockResolvedValueOnce({
        id: 'a-new',
        title: 'Module 1 Assignment',
        module: 1,
      } as any);

      const formData = new FormData();
      formData.append('title', 'Module 1 Assignment');
      formData.append('description', 'Learn HTML semantics');
      formData.append('module', '1');
      formData.append('validationType', 'STATIC');

      const result = await createAssignment(formData);
      expect(result.success).toBe(true);
      expect(result.assignment.id).toBe('a-new');
    });
  });

  describe('toggleAssignmentStatus', () => {
    it('toggles active status successfully', async () => {
      vi.mocked(getAuthSession).mockResolvedValueOnce({
        user: { id: 't-1', role: 'TRAINER' },
      } as any);

      vi.mocked(prisma.assignment.update).mockResolvedValueOnce({
        id: 'a-1',
        isActive: false,
      } as any);

      const res = await toggleAssignmentStatus('a-1', true);
      expect(res.success).toBe(true);
      expect(res.assignment.isActive).toBe(false);
    });
  });

  describe('togglePublishStatus', () => {
    it('toggles publish status successfully', async () => {
      vi.mocked(getAuthSession).mockResolvedValueOnce({
        user: { id: 't-1', role: 'TRAINER' },
      } as any);

      vi.mocked(prisma.assignment.update).mockResolvedValueOnce({
        id: 'a-1',
        isPublished: true,
      } as any);

      const res = await togglePublishStatus('a-1', false);
      expect(res.success).toBe(true);
      expect(res.assignment.isPublished).toBe(true);
    });
  });

  describe('deleteAssignment', () => {
    it('deletes assignment and associated submissions', async () => {
      vi.mocked(getAuthSession).mockResolvedValueOnce({
        user: { id: 't-1', role: 'TRAINER' },
      } as any);

      const res = await deleteAssignment('a-1');
      expect(prisma.submission.deleteMany).toHaveBeenCalledWith({ where: { assignmentId: 'a-1' } });
      expect(prisma.assignment.delete).toHaveBeenCalledWith({ where: { id: 'a-1' } });
      expect(res.success).toBe(true);
    });
  });
});
