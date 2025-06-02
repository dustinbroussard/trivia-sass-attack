
import { TriviaQuestion, QuestionBank, Category } from '@/types/game';

// Mock question data based on your samples
const mockQuestions: QuestionBank = {
  'Science': [
    {
      id: "9d353a5b1db66eb06ca5c1f8512efedeb90adb591bded6a0e6e2b7e031b1295b",
      category: "Science",
      question: "What gas do plants absorb during photosynthesis?",
      choices: ["Oxygen", "Hydrogen", "Carbon Dioxide", "Nitrogen"],
      answer_index: 2,
      correct_quip: "Photosynthetic perfection! Your brain cells clearly aren't dormant.",
      wrong_answer_quips: {
        "0": "Oxygen? Plants exhale that, champ. Like you exhale disappointment.",
        "1": "Hydrogen? That's for blimps and bad decisions. Are you photosynthesizing stupidity?",
        "3": "Nitrogen? Your plants would be sobbing if you fed them that."
      },
      used: false
    },
    {
      id: "16e9a13e42100ac6114d3e6643a28be9b28994e6309b4e543e68add3bf8eb74e",
      category: "Science",
      question: "What particle has a negative charge?",
      choices: ["Proton", "Neutron", "Electron", "Quark"],
      answer_index: 2,
      correct_quip: "You must be positively charged about that correct answer!",
      wrong_answer_quips: {
        "0": "Proton? That's the opposite of helpful.",
        "1": "Neutron? Neutral much?",
        "3": "Quark? Cool word. Still wrong."
      },
      used: false
    }
  ],
  'History': [
    {
      id: "d7311f3f2e3eae38bf40e1bed1069c4a4d7785013db16194b1ebcab125025890",
      category: "History",
      question: "Who was the first president of the United States?",
      choices: ["Abraham Lincoln", "George Washington", "Thomas Jefferson", "John Adams"],
      answer_index: 1,
      correct_quip: "First and finest. Just like your answer.",
      wrong_answer_quips: {
        "0": "Lincoln? Wrong century, legend.",
        "2": "Jefferson? He wrote, didn't lead first.",
        "3": "Adams? Almost, but nope."
      },
      used: false
    },
    {
      id: "8b249fafc550c177f7d4e1a92f4d196c894c25507b777d84596c1bba6f42f2bb",
      category: "History",
      question: "In what year did World War II end?",
      choices: ["1942", "1945", "1939", "1950"],
      answer_index: 1,
      correct_quip: "Nice! You just won the war on ignorance.",
      wrong_answer_quips: {
        "0": "1942? That's mid-carnage, not the finale.",
        "2": "1939? That's the kickoff, not the credits.",
        "3": "1950? That was Korea, not Hitler's ending."
      },
      used: false
    }
  ],
  'Pop Culture': [
    {
      id: "pc1",
      category: "Pop Culture",
      question: "Which social media platform was originally called 'FaceMash'?",
      choices: ["Instagram", "Facebook", "Snapchat", "TikTok"],
      answer_index: 1,
      correct_quip: "Someone's been paying attention to tech history! 📱",
      wrong_answer_quips: {
        "0": "Instagram? That came way later, genius.",
        "2": "Snapchat? Wrong ghost story.",
        "3": "TikTok? You're about a decade off."
      },
      used: false
    }
  ],
  'Art & Music': [
    {
      id: "am1",
      category: "Art & Music",
      question: "Which artist painted 'The Starry Night'?",
      choices: ["Pablo Picasso", "Vincent van Gogh", "Claude Monet", "Salvador Dalí"],
      answer_index: 1,
      correct_quip: "You've got some culture in you after all! 🎨",
      wrong_answer_quips: {
        "0": "Picasso? Wrong artistic movement, buddy.",
        "2": "Monet? He did water lilies, not swirls.",
        "3": "Dalí? Too melty, not swirly enough."
      },
      used: false
    }
  ],
  'Sports': [
    {
      id: "sp1",
      category: "Sports",
      question: "How many rings are on the Olympic flag?",
      choices: ["4", "5", "6", "7"],
      answer_index: 1,
      correct_quip: "Olympic knowledge! Going for the gold! 🥇",
      wrong_answer_quips: {
        "0": "Four? Not enough rings for this circus.",
        "2": "Six? You're overthinking the symbolism.",
        "3": "Seven? This isn't a phone number."
      },
      used: false
    }
  ],
  'Random': [
    {
      id: "r1",
      category: "Random",
      question: "What's the most stolen food in the world?",
      choices: ["Bread", "Cheese", "Chocolate", "Bananas"],
      answer_index: 1,
      correct_quip: "You know your crime statistics! Suspicious... 🧀",
      wrong_answer_quips: {
        "0": "Bread? Too basic for crime.",
        "2": "Chocolate? Sweet guess, but nope.",
        "3": "Bananas? That's just monkey business."
      },
      used: false
    }
  ]
};

export class QuestionBankService {
  private questionBank: QuestionBank = {};
  private isLoading = false;

  constructor() {
    this.initializeWithMockData();
  }

  private initializeWithMockData() {
    // Deep clone mock data to avoid mutation
    this.questionBank = JSON.parse(JSON.stringify(mockQuestions));
  }

  async getNextQuestion(category: Category): Promise<TriviaQuestion | null> {
    const categoryQuestions = this.questionBank[category] || [];
    const availableQuestions = categoryQuestions.filter(q => !q.used);
    
    if (availableQuestions.length === 0) {
      // Need to fetch more questions
      await this.refillCategory(category);
      const refilled = this.questionBank[category]?.filter(q => !q.used) || [];
      if (refilled.length === 0) return null;
      return this.selectRandomQuestion(refilled);
    }
    
    return this.selectRandomQuestion(availableQuestions);
  }

  private selectRandomQuestion(questions: TriviaQuestion[]): TriviaQuestion {
    const randomIndex = Math.floor(Math.random() * questions.length);
    const selectedQuestion = questions[randomIndex];
    selectedQuestion.used = true;
    return selectedQuestion;
  }

  private async refillCategory(category: Category): Promise<void> {
    if (this.isLoading) return;
    
    this.isLoading = true;
    console.log(`🧠 Summoning trivia gods for ${category}...`);
    
    // TODO: Replace with actual OpenRouter API call
    // For now, just reset the used flags to simulate refill
    setTimeout(() => {
      const categoryQuestions = this.questionBank[category] || [];
      categoryQuestions.forEach(q => q.used = false);
      this.isLoading = false;
      console.log(`✨ ${category} questions refilled!`);
    }, 1000);
  }

  getStats(): { total: number; used: number; available: number } {
    const allQuestions = Object.values(this.questionBank).flat();
    const used = allQuestions.filter(q => q.used).length;
    return {
      total: allQuestions.length,
      used,
      available: allQuestions.length - used
    };
  }

  reset() {
    this.initializeWithMockData();
  }
}

export const questionBankService = new QuestionBankService();
