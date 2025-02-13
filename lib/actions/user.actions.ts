'use server'

import { Query, ID } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { parseStringify } from "../utils";

export const createAccount = async ({
    fullName,
    email,
}: {
    fullName: string;
    email: string;
}) => {
    const existingUser = await getUserByEmail(email);

    const accountId = await sendEmailOTP({email})

    if(!accountId) throw new Error("Failed to send an OTP")

    if(!existingUser){
        const {databases} = await createAdminClient();

        await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionId,
            ID.unique(),
            {
                fullName,
                email,
                avatar: "https://cdn-icons-png.flaticon.com/512/3541/3541871.png",
                accountId
            }
        )
    }

    return parseStringify({accountId});
};

const getUserByEmail = async (email: string) => {
    const {databases} = await createAdminClient();

    const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        [Query.equal("email", [email])]
    )

    return result.total > 0 ? result.documents[0] : null
}

const sendEmailOTP = async ({email}: { email: string; }) => {
    const {account} = await createAdminClient();

    try{
        const session = await account.createEmailToken(ID.unique(), email)

        return session.userId
    }catch(error){
        handleError(error, "Failed to  send email OTP")
    }
}

const handleError = (error: unknown, message: string) => {
    console.log(error, message);
    throw error
}

