"use server"

import { connectToDB } from "../mongoose"
import User from "../models/user.model";
import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import path from "path";
import { Ewert } from "next/font/google";
import { FilterQuery, SortOrder } from "mongoose";
import { skip } from "node:test";

interface Params {
    userId: string,
    username: string,
    name: string,
    bio: string,
    image: string,
    path: string,
}

export async function updateUser({
    userId,
    username,
    name,
    bio,
    image,
    path,
}: Params): Promise<void> {
    
    connectToDB();

    try {

        await User.findOneAndUpdate(
            { id: userId },
            {
                username: username.toLowerCase(),
                name, 
                bio,
                image,
                onboarded: true,
            },
            { upsert: true }
        );

        if(path === '/profile/edit')
        {
            revalidatePath(path);
        }

    } catch (error: any) {
        throw new Error(`Failed to create/update user: ${error.message}`)
    }
}

//returning the current user
export async function fetchUser(userId: string) {
    try {
        connectToDB();
        return await User
            .findOne({ id: userId })
            // .populate({
            //      path: 'communities',
            //      model: Community
            // })
    } catch (error: any) {
        throw new Error(`Failed to fetch user: ${error.message}`)
    }
}

//returning all the posts of the current user
export async function fetchUserPosts(userId: string) {
    try {
        connectToDB();

        //find all threads and their comments by user with the given 
        //todo: populate community
        const threads = await User.findOne({ id: userId })
            .populate({
                path: 'threads',
                model: Thread,
                populate: {
                    path: 'children',
                    model: Thread,
                    populate: {
                        path: 'author',
                        model: User,
                        select: 'name image id'
                    }
                }
            })
        
        return threads;
    } catch (error: any) {
        throw new Error(`Failed to fetch user posts: ${error.message}`)
    }
}

//function to return users in the a search query from the search tab functionality
export async function fetchUsers({
    userId,
    searchString = "",
    pageNumber = 1,
    pageSize = 20,
    sortBy = "desc"
} : {
    userId : string,
    searchString?: string,
    pageNumber?: number,
    pageSize?: number,
    sortBy?: SortOrder
}) {
    try {
        connectToDB();

        //calculate the number of users to skip based on the page number and page size
        const skipAmount = (pageNumber -1) * pageSize;
        const regex = new RegExp(searchString, "i");

        const query: FilterQuery<typeof User> = {
            if: { $ne: userId }
        }

        if(searchString.trim() !== '') {
            query.$or = [
                { username: { $regex: regex } },
                { name: { $regex: regex } }
            ]
        }

        const sortOptions = { createdAt: sortBy };

        const usersQuery = User.find(query)
            .sort(sortOptions)
            .skip(skipAmount)
            .limit(pageSize);
        
        const totalUsersCount = await User.countDocuments(query);

        const users = await usersQuery.exec();
        const isNext = totalUsersCount > skipAmount + users.length;
        return { users, isNext };

    } catch (error: any) {
        throw new Error(`Failed to fetch queries: ${error.message}`)
    }
}

export async function getActivity(userId: string) {
    try {
        connectToDB();

        //find all the threads created by the user
        const userThreads = await Thread.find({author: userId });

        //collect all the comments/replies/children to the posts
        const childThreadIds = userThreads.reduce((acc, userThread) => {
            return acc.concat(userThread.children)
        }, [])

        const replies = await Thread.find({
            _id: { $in: childThreadIds },
            author: { $ne: userId } 
        }).populate({
            path: 'author',
            model: User,
            select: 'name image _id'
        })

        return replies;

    } catch (error: any) {
        throw new Error(`Failed to fetch activity: ${error.message}`)
    }
}