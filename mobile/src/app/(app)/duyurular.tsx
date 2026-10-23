import DuyurularEkrani from "../../screens/DuyurularEkrani";
import { useOturum } from "../../oturum";

export default function Duyurular(){
  const { oturum } = useOturum();

  if(oturum === null) {
    return null;
  }

  return <DuyurularEkrani token={oturum.token} yonetici={oturum.user.role === 'admin'} />;
}