import type { IAttachment } from 'src/features/attachments';

export interface IUpdateAttachmentAction {
  attachment: IAttachment;
  componentId: string;
  baseComponentId: string;
  tag: string;
}

export interface IUpdateAttachmentActionFulfilled {
  attachment: IAttachment;
  componentId: string;
  baseComponentId: string;
}

export interface IUpdateAttachmentActionRejected {
  attachment: IAttachment;
  componentId: string;
  baseComponentId: string;
  tag: string | undefined;
}
