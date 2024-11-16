import { getSystemDetails } from "@/app/lib/system";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import VideoFeed from "../VideoFeed/VideoFeed";
import RunnerImages from "../RunnerImages";
import styles from './HomePage.module.scss';
import TopTrim from "../TopTrim/TopTrim";
import UserPanel from "../UserPanel/UserPanel";

export default async function Home() {
  const systemInfo = await getSystemDetails();

  return (
    <div className={styles.homePage}>
      <TopTrim />
      <UserPanel />
      {/* <div className="flex gap-4 justify-content-center  flex-col md:flex-row align-items-center">
        <Card className="w-full max-w-md border-none">
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {[
                ["CPU Temperature", `${systemInfo.cpuTemp.toFixed(1)}°C`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}:</span>
                  <span className="text-foreground font-medium">{value}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">CPU Usage</h3>
              {systemInfo.cpuUsage.map((usage, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Core {index}</span>
                    <span>{usage}%</span>
                  </div>
                  <Progress value={parseFloat(usage)} className="h-2" />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Memory Usage</h3>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Used</span>
                <span>{systemInfo.memoryUsage.used.toFixed(2)} / {systemInfo.memoryUsage.total.toFixed(2)} GB</span>
              </div>
              <Progress 
                value={(systemInfo.memoryUsage.used / systemInfo.memoryUsage.total) * 100} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
        <div>
        <h3 className="text-lg font-semibold text-foreground text-center  mb-20">Red Light Runners</h3>
        <RunnerImages />
        </div>
        
      </div> */}
    </div>
  );
}