import { AppError, asyncHandler } from '../../common/utils/helpers.js';
import { created, ok } from '../../common/utils/response.js';
import * as motherService from '../mothers/mother.service.js';
import { Document } from './document.model.js';
import { removeFile, resolveKey } from '../../integrations/storage.service.js';
export const create = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Choose a file to upload', 400);
  const mother = await motherService.findInScope(req.body.motherId, req.user);
  const document = await Document.create({
    mother: mother.id,
    pregnancy: req.body.pregnancyId || null,
    docType: req.body.docType,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    storageKey: req.file.filename,
    uploadedBy: req.user.id,
  });
  return created(res, document);
});
export const list = asyncHandler(async (req, res) => {
  const motherIds = await motherService.idsInScope(req.user);
  const filter = {};
  if (req.query.motherId) {
    if (motherIds && !motherIds.some((id) => String(id) === req.query.motherId)) return ok(res, []);
    filter.mother = req.query.motherId;
  } else if (motherIds) filter.mother = { $in: motherIds };
  const rows = await Document.find(filter).sort({ createdAt: -1 });
  return ok(res, rows);
});
export const getOne = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) throw new AppError('Document not found', 404);
  await motherService.findInScope(document.mother, req.user);
  return ok(res, document);
});
export const download = asyncHandler(async (req, res, next) => {
  const document = await Document.findById(req.params.id);
  if (!document) throw new AppError('Document not found', 404);
  await motherService.findInScope(document.mother, req.user);
  res.download(resolveKey(document.storageKey), document.originalName, (error) => {
    if (error && !res.headersSent) next(new AppError('File is missing', 404));
  });
});
export const remove = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) throw new AppError('Document not found', 404);
  await motherService.findInScope(document.mother, req.user);
  await removeFile(document.storageKey);
  await document.deleteOne();
  return ok(res, null, 'Document removed');
});