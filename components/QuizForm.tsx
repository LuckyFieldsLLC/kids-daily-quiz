import React, { useState, useEffect } from 'react';
import Button from './Button';
import type { Quiz, NewQuiz } from '../types';
import LevelSelector from './LevelSelector';

interface QuizFormProps {
  quiz: Quiz | NewQuiz | null;
  onSave: (quiz: NewQuiz | Quiz) => void;
  onCancel: () => void;
  isSaving: boolean;
}

const emptyQuiz: NewQuiz = {
    question: '',
    options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
    answer: '',
    is_active: true,
    difficulty: 2, // Default to normal
    fun_level: 2, // Default to fun
};

const difficultyLevels: { [key: number]: string } = { 1: 'やさしい', 2: 'ふつう', 3: 'むずかしい' };
const funLevels: { [key: number]: string } = { 1: 'ふつう', 2: 'おもしろい', 3: 'すごくおもしろい' };

const QuizForm: React.FC<QuizFormProps> = ({ quiz, onSave, onCancel, isSaving }) => {
  const [formData, setFormData] = useState<Quiz | NewQuiz>(quiz || emptyQuiz);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Ensure options are always an array of objects, and defaults are set
    const initialQuiz = quiz || emptyQuiz;
    if (!initialQuiz.options || !Array.isArray(initialQuiz.options)) {
        initialQuiz.options = [{ text: '' }, { text: '' }, { text: '' }, { text: '' }];
    }
    const dataWithDefaults: Quiz | NewQuiz = {
        ...emptyQuiz,
        ...initialQuiz,
    };
    setFormData(dataWithDefaults);
  }, [quiz]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index] = { text: value };
    setFormData(prev => ({ ...prev, options: newOptions }));
  };
  
  const validate = (): boolean => {
      const newErrors: { [key: string]: string } = {};
      if (!formData.question.trim()) {
          newErrors.question = '問題文を入力してください。';
      }
      const options = formData.options || [];
      const hasEmptyOption = options.some(opt => !(opt.text && opt.text.trim()));
      if (options.length < 2 || hasEmptyOption) {
          newErrors.options = 'すべての選択肢を入力してください。';
      }
      if (!formData.answer.trim()) {
          newErrors.answer = '正解を入力してください。';
      } else if (!options.some(opt => opt.text === formData.answer)) {
          newErrors.answer = '正解は選択肢のいずれかと一致する必要があります。';
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div>
        <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
          問題文
        </label>
        <textarea
          id="question"
          name="question"
          value={formData.question}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
          required
        />
        {errors.question && <p className="text-red-500 text-xs mt-1">{errors.question}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          選択肢
        </label>
        <div className="space-y-2">
          {(formData.options || []).map((option, index) => (
            <input
              key={index}
              type="text"
              value={option.text}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`選択肢 ${index + 1}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              required
            />
          ))}
        </div>
        {errors.options && <p className="text-red-500 text-xs mt-1">{errors.options}</p>}
      </div>

      <div>
        <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-1">
          正解
        </label>
        <input
          id="answer"
          name="answer"
          type="text"
          value={formData.answer}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
          required
        />
         {errors.answer && <p className="text-red-500 text-xs mt-1">{errors.answer}</p>}
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LevelSelector
                label="難易度"
                name="difficulty"
                options={difficultyLevels}
                selectedValue={formData.difficulty}
                onChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}
            />
            <LevelSelector
                label="面白さ"
                name="fun_level"
                options={funLevels}
                selectedValue={formData.fun_level}
                onChange={(value) => setFormData(prev => ({ ...prev, fun_level: value }))}
            />
        </div>

      <div className="border-t pt-4">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input 
                type="checkbox"
                name="is_active"
                checked={(formData as Quiz).is_active}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            このクイズを公開する (利用者の画面に表示する)
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" type="button" onClick={onCancel}>キャンセル</Button>
        <Button type="submit" loading={isSaving}>{isSaving ? '保存中...' : '保存'}</Button>
      </div>
    </form>
  );
};

export default QuizForm;