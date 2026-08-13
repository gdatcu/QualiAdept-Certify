'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function createAssignment(formData: FormData) {
  const session = await getAuthSession();
  if (!session || session.user?.role !== 'TRAINER') {
    throw new Error('Unauthorized: Trainer access required.');
  }

  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const moduleRaw = formData.get('module') as string;
  const validationType = (formData.get('validationType') as string)?.trim();
  const validationRules = (formData.get('validationRules') as string)?.trim() || null;
  const passingSample = (formData.get('passingSample') as string)?.trim() || null;
  const failingSample = (formData.get('failingSample') as string)?.trim() || null;

  if (!title || !description || !moduleRaw || !validationType) {
    throw new Error('All fields (Module #, Title, Validation Type, Description) are required.');
  }

  const moduleNum = parseInt(moduleRaw, 10);
  if (isNaN(moduleNum) || moduleNum <= 0) {
    throw new Error('Module number must be a positive integer.');
  }

  if (validationType !== 'STATIC' && validationType !== 'DYNAMIC') {
    throw new Error('Validation Type must be either STATIC or DYNAMIC.');
  }

  // JSON syntax check for validationRules
  if (validationRules && validationRules.trim().length > 0) {
    try {
      JSON.parse(validationRules);
    } catch {
      throw new Error('Invalid JSON format in Validation Rules. Please check for missing quotes or commas.');
    }
  }

  // Anti-Duplicate Module Number check
  const existingModule = await prisma.assignment.findFirst({
    where: { module: moduleNum },
  });

  if (existingModule) {
    throw new Error(`An assignment with Module #${moduleNum} already exists ("${existingModule.title}").`);
  }

  const newAssignment = await prisma.assignment.create({
    data: {
      title,
      description,
      module: moduleNum,
      validationType,
      validationRules,
      passingSample,
      failingSample,
      isActive: true,
    },
  });

  revalidatePath('/trainer/assignments');
  revalidatePath('/trainer');
  revalidatePath('/');

  return { success: true, assignment: newAssignment };
}

export async function toggleAssignmentStatus(id: string, currentStatus: boolean) {
  const session = await getAuthSession();
  if (!session || session.user?.role !== 'TRAINER') {
    throw new Error('Unauthorized: Trainer access required.');
  }

  if (!id) {
    throw new Error('Assignment ID is required.');
  }

  const updatedAssignment = await prisma.assignment.update({
    where: { id },
    data: {
      isActive: !currentStatus,
    },
  });

  revalidatePath('/trainer/assignments');
  revalidatePath('/trainer');
  revalidatePath('/');

  return { success: true, assignment: updatedAssignment };
}

export async function updateAssignment(id: string, formData: FormData) {
  const session = await getAuthSession();
  if (!session || session.user?.role !== 'TRAINER') {
    throw new Error('Unauthorized: Trainer access required.');
  }

  if (!id) {
    throw new Error('Assignment ID is required.');
  }

  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const moduleRaw = formData.get('module') as string;
  const validationType = (formData.get('validationType') as string)?.trim();
  const validationRules = (formData.get('validationRules') as string)?.trim() || null;
  const passingSample = (formData.get('passingSample') as string)?.trim() || null;
  const failingSample = (formData.get('failingSample') as string)?.trim() || null;

  if (!title || !description || !moduleRaw || !validationType) {
    throw new Error('All fields (Module #, Title, Validation Type, Description) are required.');
  }

  const moduleNum = parseInt(moduleRaw, 10);
  if (isNaN(moduleNum) || moduleNum <= 0) {
    throw new Error('Module number must be a positive integer.');
  }

  if (validationType !== 'STATIC' && validationType !== 'DYNAMIC') {
    throw new Error('Validation Type must be either STATIC or DYNAMIC.');
  }

  // JSON syntax check for validationRules
  if (validationRules && validationRules.trim().length > 0) {
    try {
      JSON.parse(validationRules);
    } catch {
      throw new Error('Invalid JSON format in Validation Rules. Please check for missing quotes or commas.');
    }
  }

  // Anti-Duplicate Module Number check (excluding current assignment ID)
  const existingModule = await prisma.assignment.findFirst({
    where: {
      module: moduleNum,
      NOT: { id },
    },
  });

  if (existingModule) {
    throw new Error(`An assignment with Module #${moduleNum} already exists ("${existingModule.title}").`);
  }

  const updatedAssignment = await prisma.assignment.update({
    where: { id },
    data: {
      title,
      description,
      module: moduleNum,
      validationType,
      validationRules,
      passingSample,
      failingSample,
    },
  });

  revalidatePath('/trainer/assignments');
  revalidatePath(`/trainer/assignments/${id}/edit`);
  revalidatePath('/trainer');
  revalidatePath('/');

  return { success: true, assignment: updatedAssignment };
}

export async function deleteAssignment(id: string) {
  const session = await getAuthSession();
  if (!session || session.user?.role !== 'TRAINER') {
    throw new Error('Unauthorized: Trainer access required.');
  }

  if (!id) {
    throw new Error('Assignment ID is required.');
  }

  // Delete associated submissions first to prevent foreign key constraint violations
  await prisma.submission.deleteMany({
    where: { assignmentId: id },
  });

  await prisma.assignment.delete({
    where: { id },
  });

  revalidatePath('/trainer/assignments');
  revalidatePath('/trainer');
  revalidatePath('/');

  return { success: true };
}
