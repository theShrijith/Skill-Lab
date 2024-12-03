const axios = require('axios');

const addExpense = async () => {
  try {
    const expense = {
      category: 'Food',
      amount: 50,
      date: '2024-12-03',
    };

    const response = await axios.post('http://localhost:3000/expenses', expense);
    console.log('Expense Added:', response.data);
  } catch (error) {
    console.error('Error adding expense:', error);
  }
};

addexpenses();
