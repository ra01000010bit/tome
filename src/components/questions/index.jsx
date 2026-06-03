import MultipleChoiceQuestion from './MultipleChoiceQuestion.jsx';
import TrueFalseQuestion from './TrueFalseQuestion.jsx';
import FlashcardQuestion from './FlashcardQuestion.jsx';
import ClozeQuestion from './ClozeQuestion.jsx';

const REGISTRY = {
  multiple_choice: MultipleChoiceQuestion,
  true_false:      TrueFalseQuestion,
  flashcard:       FlashcardQuestion,
  cloze:           ClozeQuestion,
};

export function QuestionRenderer({ question, onAnswer }) {
  const Comp = REGISTRY[question.type];
  if (!Comp) return <p>Ismeretlen típus: {question.type}</p>;
  return <Comp question={question} onAnswer={onAnswer} />;
}
