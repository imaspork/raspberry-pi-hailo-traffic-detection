import styles from "./HomePage.module.scss";
import TopTrim from "../TopTrim/TopTrim";
import UserPanel from "../UserPanel/UserPanel";

export default async function Home() {
    return (
        <div className={styles.homePage}>
            <TopTrim />
            <UserPanel />
        </div>
    );
}
