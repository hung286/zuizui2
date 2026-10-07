import pptxgen from 'pptxgenjs';
import { PlayHistory } from '../types';

export const exportHistoryToPptx = async (history: PlayHistory[]) => {
  const pptx = new pptxgen();

  // Slide 1: Title
  const slide1 = pptx.addSlide();
  slide1.addText('Báo Cáo Hoạt Động Education App', {
    x: 1, y: 2, w: '80%', h: 1,
    fontSize: 36, bold: true, color: '363636',
    align: 'center'
  });

  // Slide 2: Top 3 Students
  const slide2 = pptx.addSlide();
  slide2.addText('Vinh Danh Top 3 Học Sinh Xuất Sắc', {
    x: 0.5, y: 0.5, w: '90%', h: 1,
    fontSize: 28, bold: true, color: '228B22'
  });

  const studentMap = new Map<string, { plays: number, score: number }>();
  history.forEach(h => {
    const key = `${h.studentName} (${h.className})`;
    if (!studentMap.has(key)) {
      studentMap.set(key, { plays: 0, score: 0 });
    }
    const student = studentMap.get(key)!;
    student.plays += 1;
    student.score += h.score;
  });

  const top3 = Array.from(studentMap.entries())
    .sort((a, b) => b[1].plays - a[1].plays || b[1].score - a[1].score)
    .slice(0, 3);

  top3.forEach((item, index) => {
    slide2.addText(`Hạng ${index + 1}: ${item[0]} - ${item[1].plays} lượt chơi, ${item[1].score} điểm`, {
      x: 1, y: 2 + index * 0.8, w: '80%', h: 0.5,
      fontSize: 20, color: '363636'
    });
  });

  // Slide 3: Mode Statistics
  const slide3 = pptx.addSlide();
  slide3.addText('Thống Kê Lượt Chơi Theo Chế Độ', {
    x: 0.5, y: 0.5, w: '90%', h: 1,
    fontSize: 28, bold: true, color: '0000FF'
  });

  const modeMap = new Map<string, number>();
  history.forEach(h => {
    const count = modeMap.get(h.mode) || 0;
    modeMap.set(h.mode, count + 1);
  });

  const modes = Array.from(modeMap.entries());
  modes.forEach((item, index) => {
    slide3.addText(`Chế độ ${item[0]}: ${item[1]} lượt chơi`, {
      x: 1, y: 2 + index * 0.8, w: '80%', h: 0.5,
      fontSize: 20, color: '363636'
    });
  });

  await pptx.writeFile({ fileName: 'Bao_Cao_Hoat_Dong.pptx' });
};
