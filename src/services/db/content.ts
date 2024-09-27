import ContentModel, { type IDBContent, type MediaType } from "../../database/models/Content.js";
import ContentTypeModel, { type IDBContentType } from "../../database/models/ContentType.js";
import type { DeepPartial } from "../../utils/types.js";

export const contentModel = ContentModel;
export const contentTypeModel = ContentTypeModel;

interface ICreateContent extends DeepPartial<IDBContent> {
    type: string;
    board: string;
    class: string;
    subject: string;
    media_url: string;
    media_type: MediaType;
}

interface ICreateContentType extends Partial<IDBContentType> {
    title: string;
}

export async function findAllContentTypes() {
    return await ContentTypeModel.find({
        deleted: false,
    }).lean();
}

export async function createContentType(data: ICreateContentType) {
    const content = new ContentTypeModel(data);

    await content.save();
    return content.toObject();
}

export async function checkContentTypeExists(title: string) {
    const found = await ContentTypeModel.findOne({
        deleted: false,
        title: title,
    });

    if (found) {
        return found;
    }

    return found;
}

export async function createContent(contentBody: ICreateContent, typeId: string) {
    const content = new ContentModel(contentBody);

    await content.save();

    await addContentIdToContentType(content.id, typeId);

    return content.toObject();
}

export async function getOneContentByFilter(filter: any) {
    return ContentModel.findOne(filter).lean();
}

export async function addContentIdToContentType(id: string, typeId: string) {
    await ContentTypeModel.findByIdAndUpdate(typeId, { $addToSet: { content: id }, $inc: { no_of_content: 1 } });
}

export async function removeContent(content_id: string) {
    await Promise.all([
        ContentModel.findByIdAndUpdate(content_id, { deleted: true }),
        removeContentIdFromContentType(content_id),
    ]);
}

export async function removeContentIdFromContentType(id: string) {
    await ContentTypeModel.findOneAndUpdate(
        {
            content: id,
        },
        {
            $pull: { content: id },
            $inc: { no_of_content: -1 },
        }
    );
}
