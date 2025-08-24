// Shared message types for type safety across the application
import { Id } from "../../convex/_generated/dataModel";

// Base message interface that all messages must have
export interface BaseMessage {
  _id: string;
  _creationTime: number;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: number;
}

// Text message type
export interface TextMessage extends BaseMessage {
  type: "text";
}

// File message base interface
export interface FileMessageBase extends BaseMessage {
  fileName: string;
  fileType: string;
  fileSize: number;
}

// Image message with Convex storage
export interface ImageMessageWithStorage extends FileMessageBase {
  type: "image";
  storageId: Id<"_storage">;
  fileData?: never; // Exclusive with fileData
}

// Image message with base64 data
export interface ImageMessageWithData extends FileMessageBase {
  type: "image";
  fileData: string;
  storageId?: never; // Exclusive with storageId
}

// File message (non-image)
export interface FileMessage extends FileMessageBase {
  type: "file";
  storageId?: Id<"_storage">;
  fileData?: string;
}

// Union type for all possible message types
export type Message = TextMessage | ImageMessageWithStorage | ImageMessageWithData | FileMessage;

// Type guard functions for runtime type checking
export function isTextMessage(message: Message): message is TextMessage {
  return message.type === "text";
}

export function isImageMessage(message: Message): message is ImageMessageWithStorage | ImageMessageWithData {
  return message.type === "image";
}

export function isFileMessage(message: Message): message is FileMessage {
  return message.type === "file";
}

export function hasStorageId(message: Message): message is ImageMessageWithStorage | (FileMessage & { storageId: Id<"_storage"> }) {
  return 'storageId' in message && message.storageId !== undefined;
}

export function hasFileData(message: Message): message is ImageMessageWithData | (FileMessage & { fileData: string }) {
  return 'fileData' in message && message.fileData !== undefined;
}