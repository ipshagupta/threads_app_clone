import PostThread from "@/components/forms/PostThread";
import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

async function Page(){
    const user = await currentUser();

    if(!user) return null;
    const userInfo = await fetchUser(user.id);

    //this will allow us to bring all the users who switched their url bar manually and bring them back to onboarding if they haven't yet
    if(!userInfo?.onboarded) redirect('/onboarding');

    return (
        <>
            <h1 className="head-text">Create Thread</h1>
            <PostThread userId={userInfo._id}/>
        </> 
    )
}

export default Page;