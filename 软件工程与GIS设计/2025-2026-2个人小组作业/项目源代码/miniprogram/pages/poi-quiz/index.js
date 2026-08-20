const cloudService = require("../../services/cloud");
const {
  clearPendingPoiQuiz,
  loadPendingPoiQuiz,
  savePoiQuizResult,
} = require("../../utils/storage");
const { resolveQuizAnswer } = require("../../services/poi-service");

Page({
  data: {
    loading: false,
    poiName: "校园地标",
    description: "",
    knowledge: "",
    question: "",
    options: [],
    selectedOptionId: "",
    errorText: "",
  },

  onLoad() {
    const pendingQuiz = loadPendingPoiQuiz();
    if (!pendingQuiz || !pendingQuiz.poiRule || !pendingQuiz.quiz) {
      this.setData({
        errorText: "没有待完成的地标答题。",
      });
      return;
    }

    this.pendingQuiz = pendingQuiz;
    this.setData({
      poiName: pendingQuiz.poiRule.name,
      description: pendingQuiz.poiRule.description || "",
      knowledge: pendingQuiz.poiRule.knowledge || "",
      question: pendingQuiz.quiz.question,
      options: pendingQuiz.quiz.options.map((option) => ({
        ...option,
        selected: false,
      })),
    });
  },

  handleSelectOption(event) {
    const optionId = event.currentTarget.dataset.optionId;
    this.setData({
      selectedOptionId: optionId,
      options: this.data.options.map((option) => ({
        ...option,
        selected: option.option_id === optionId,
      })),
    });
  },

  async handleSubmit() {
    if (!this.pendingQuiz || !this.pendingQuiz.poiRule) {
      return;
    }

    if (!this.data.selectedOptionId) {
      wx.showToast({
        title: "请选择一个答案",
        icon: "none",
      });
      return;
    }

    const answer = resolveQuizAnswer(this.pendingQuiz.poiRule, this.data.selectedOptionId);
    this.setData({
      loading: true,
    });

    if (cloudService.isCloudReady()) {
      await cloudService.submitPoiQuiz({
        poi_id: this.pendingQuiz.poiRule.poi_id,
        poi_name: this.pendingQuiz.poiRule.name,
        poi_category: this.pendingQuiz.poiRule.type || "",
        description: this.pendingQuiz.poiRule.description || "",
        quiz_question: this.pendingQuiz.quiz.question,
        selected_option_id: this.data.selectedOptionId,
        passed: answer.passed,
        trigger_time: this.pendingQuiz.triggerTime || new Date().toISOString(),
      });
    }

    savePoiQuizResult({
      poiRule: this.pendingQuiz.poiRule,
      selectedOptionId: this.data.selectedOptionId,
      passed: answer.passed,
      successText: answer.successText,
      failureText: answer.failureText,
    });

    if (!answer.passed) {
      clearPendingPoiQuiz();
    }

    this.setData({
      loading: false,
    });

    wx.navigateBack();
  },
});
