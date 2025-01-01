import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import RunnerImages from "./components/RunnerImages/RunnerImages";
import VideoFeed from "./components/VideoFeed/VideoFeed";
import Homepage from "./components/Homepage/Homepage";

export default async function Home() {
    return (
        <main className="min-h-screen bg-background flex flex-col items-center p-6 dark">
            <Homepage />
        </main>
    );
}
