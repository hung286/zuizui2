import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { Question } from '../types';

export const exportQuestionsToDocx = async (questions: Question[], title: string = 'Ngan_hang_cau_hoi') => {
  const children = [];

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 32,
        }),
      ],
      spacing: { after: 400 },
    })
  );

  questions.forEach((q, index) => {
    // Question text
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Câu ${index + 1}: ${q.question}`,
            bold: true,
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );

    // Options
    const optionLabels = ['A', 'B', 'C', 'D'];
    q.options.forEach((opt, optIndex) => {
      const isCorrect = q.correctIndex === optIndex;
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${optionLabels[optIndex]}. ${opt}`,
              bold: isCorrect,
              color: isCorrect ? '228B22' : '000000',
            }),
          ],
          spacing: { after: 50 },
          indent: { left: 720 }, // 0.5 inch
        })
      );
    });

    // Explanation
    if (q.explanation) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Giải thích: ${q.explanation}`,
              italics: true,
              color: '666666',
            }),
          ],
          spacing: { before: 50, after: 200 },
          indent: { left: 720 },
        })
      );
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title}.docx`);
};
