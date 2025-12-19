import { useState } from 'react';
import { getAllCategories, LocalCategory } from '../lib/categories';

type CategoryNavProps = {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
};

export default function CategoryNav({ selectedCategory, onSelectCategory }: CategoryNavProps) {
  const [categories] = useState<LocalCategory[]>(getAllCategories());

  return (
    <nav className="bg-white shadow-md border-b-4 border-orange-500">
      <div className="container mx-auto px-4">
        <div className="flex space-x-1 overflow-x-auto py-3">
          <button
            onClick={() => onSelectCategory(null)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
