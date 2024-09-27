import BlogModel from "../../../database/models/blogs/Blogs.js";
import BlogCategory from "../../../database/models/blogs/BlogCategory.js";

export const model = BlogModel;

export const category = BlogCategory;

export async function getBlogsList() {
    const list = await BlogModel.aggregate()
        .match({ deleted: false })
        .project({
            _id: 1,
            created_at: 1,
            title: 1,
            meta_description: 1,
            feature_image: 1,
            comments: { $size: "$comments" },
        });
    return list;
}

export async function getAllBlogsList() {
    const list = await BlogModel.aggregate().match({ deleted: false });
    return list;
}
export async function getBlogsListByCategory(category = []) {
    const list = await BlogModel.find({ deleted: false, categories: { $in: category } }).lean();
    return list;
}

export async function getBlogsListByTags(tags = []) {
    const list = await BlogModel.find({ deleted: false, tags: { $in: tags } }).lean();
    return list;
}

export async function getBlogByTitle(title: $TSFixMe) {
    const blog = await BlogModel.findOne({ deleted: false, title: title }).select("-deleted -updated_at").lean();
    return blog;
}

export async function addBlog(body: $TSFixMe) {
    const blog = new BlogModel(body);
    await blog.save();
    return blog.toObject();
}

export async function addCommentsToBlog(blogId: $TSFixMe, comments: $TSFixMe) {
    await BlogModel.findByIdAndUpdate(blogId, { $addToSet: { comments: comments } });
    return true;
}

export async function updateBlogById(blogId: $TSFixMe, update: $TSFixMe) {
    const data = await BlogModel.findByIdAndUpdate(blogId, update);
    return data;
}

export async function removeblogById({ id, updated_by }: $TSFixMe) {
    await BlogModel.findByIdAndUpdate(id, { deleted: true, updated_by });
}

export async function addCategory(title: $TSFixMe) {
    const blogCategory = new BlogCategory({ title });
    await blogCategory.save();

    return blogCategory.toObject();
}

export async function getAllBlogCategory() {
    const list = await BlogCategory.find().lean();
    return list;
}

export async function findBlogCategoryByTitle(title: $TSFixMe) {
    const list = await BlogCategory.find({ title }).lean();
    return list;
}

export async function removeCategoryByTitle(title: $TSFixMe) {
    return await BlogCategory.deleteMany({ title }).lean();
}
