"use server"

import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";

interface Params {
    text: string,
    author: string,
    communityId: string | null,
    path: string,
}

export async function createThread({ text, author, communityId, path }: Params) {
    connectToDB();

    try {
        const createdThread = await Thread.create({
            text,
            author,
            community: null,
        });

        //update user model
        await User.findByIdAndUpdate(author, {
            $push: { threads: createdThread._id },
        });

        revalidatePath(path);
    } catch (error: any) {
        throw new Error(`Failed to create thread: ${error.message}`);
    }

    
}

export async function fetchPosts( pageNumber=1, pageSize=20) {
    connectToDB();

    //calculating the number of posts to skip/pagenation
    const skipAmount = (pageNumber -1) * pageSize; //posts on a page

    //fetching the posts that have no parent/individual posts/OG posts
    const postsQuery = Thread.find({ parentId: { $in: [null, undefined]}})
        .sort({ createdAt: 'desc' })
        .skip(skipAmount)
        .limit(pageSize)
        .populate({ path: 'author', model: User }) 
        .populate({
            path: 'children',
            populate: {
                path: 'author',
                model: User,
                select: "_id name parentId image"
            }
        })

    const totalPostsCount = await Thread.countDocuments({ parentId: { $in: [null, undefined]} })
    const posts = await postsQuery.exec(); 
    const isNext = totalPostsCount > skipAmount + posts.length; //is there a next page
    return { posts, isNext };

}

export async function fetchThreadById(id: string) {
    connectToDB();

    try {
        
        //Todo: populate community

        const thread = await Thread.findById(id)
            .populate({
                path: 'author',
                model: User,
                select: "_id id name image"
            })
            .populate({
                path: 'children',
                populate: [
                    {
                        path: 'author',
                        model: User,
                        select: "_is id name parentId image"
                    },
                    {
                        path: 'children',
                        model: Thread,
                        populate: {
                            path: 'author',
                            model: User,
                            select: "_id id name parentId image"
                        }
                    }
                ]
            }).exec();
            return thread;

    } catch (error: any) {
        throw new Error(`Error fetching the thread: ${error.message}`)
    }
}

export async function addCommentToThread(
    threadId: string,
    commentText: string,
    userId: string,
    path: string
) {
    connectToDB();

    try {
        //find the og post by its ID
        const originalThread = await Thread.findById(threadId);

        if(!originalThread) {
            throw new Error("Thread not found")
        }
        
        //create new thread with the comment
        const commentThread = new Thread({
            text: commentText,
            author: userId,
            parentId: threadId,
        })

        //save the thread to db
        const savedCommentThread = await commentThread.save();

        //update the og thread with the comment
        originalThread.children.push(savedCommentThread._id);

        //save the og thread
        await originalThread.save();

        //revalidate the path
        revalidatePath(path);

    } catch (error: any) {
        throw new Error(`Error adding comment to thread: ${error.message}`)
    }
}