import mongoose from 'mongoose'; 

let isConnected = false; // variable to track the connection

export const connectToDB = async () => {
    mongoose.set('strictQuery', true);

    if(!process.env.MONGODB_URL) 
        return console.log('MONGODB_URL not found');
    if(isConnected)
        return console.log('Already connected to MongoDB');

    try {
        await mongoose.connect(process.env.MONGODB_URL!); //the exclamation mark here is the non-null assertion operator which tells typescript that even tho a var looks empty, it can trust you that it's not
        isConnected = true;
        console.log('Connected to MongoDB');

    } catch (error) {
        console.log(error);
    }
}