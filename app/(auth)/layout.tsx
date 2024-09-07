import { ClerkProvider } from "@clerk/nextjs"
import { Inter } from "next/font/google"
import '../globals.css';

export const metadata = {
    title: "Threads Clone",
    description: "a next.js 13 app"
}

const inter = Inter({ subsets: ["latin"]});

export default function RootLayout({ 
    children 
}: { 
    children: React.ReactNode
}) {
    return (
        <ClerkProvider>
            {/* The clerk provider wrapper will enable us to use all the of the clerk functionalities */}
            <html lang="en">
                {/* this will import the font class defined above and apply it throughout the application */}
                <body className={`${inter.className} bg-dark-1`}>
                    <div className="w-full flex justify-center items-center min-h-screen">{children}</div> {/* rendering the children: all content that will be shown in this layout */}
                </body>
            </html>     
        </ClerkProvider>
    )
}