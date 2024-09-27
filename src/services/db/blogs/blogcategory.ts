import BlogCategoryModel from "../../../database/models/blogs/BlogCategory.js";

export const model = BlogCategoryModel;

export async function getBlogCategoryList() {
    const list = await BlogCategoryModel.find({ deleted: false }).lean();
    return list;
}

export async function createBlogCategory(body: $TSFixMe) {
    const BlogCategory = new BlogCategoryModel(body);
    await BlogCategory.save();
    return BlogCategory.toObject();
}

export async function updateBlogCategory(BlogCategoryId: $TSFixMe, update: $TSFixMe) {
    const data = await BlogCategoryModel.findByIdAndUpdate(BlogCategoryId, update);
    return data;
}

export async function removeBlogCategoryById({ id, updated_by }: $TSFixMe) {
    await BlogCategoryModel.findByIdAndUpdate(id, { deleted: true, updated_by });
}
