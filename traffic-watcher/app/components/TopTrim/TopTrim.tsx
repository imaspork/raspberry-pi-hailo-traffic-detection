import { HeadingH1, Subtitle } from '../Text/Text';
import styles from './TopTrim.module.scss';

const TopTrim: React.FC = () => {

  return (
    <div className={styles.topTrim}>
      <HeadingH1>Red Light Watcher</HeadingH1>
      <Subtitle className="text-foreground">Burlingame, California Ave Pedestrian Crossing</Subtitle>
      <hr className={styles.divider} />
    </div>
  );
}

export default TopTrim