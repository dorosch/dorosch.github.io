const graph = new GitGraph({
  elementId: "graph", 
  template: new GitGraph.Template({
      colors: [
      "#ff0000",
      "#33cc33",
      "#ff6600",
      "#0066ff",
      "#009999",
      "#cc0099",
      "#0099ff",
    ],
    branch: {
      lineWidth: 3,
      spacingX: 25,
    },
    commit: {
      spacingY: 35,
      dot: {
        size: 10
      },
      message: {
        displayAuthor: false,
        displayBranch: true,
        displayHash: true,
        font: "normal 14pt Arial"
      }
    }
  })
});

const master = graph
  .branch("master")
  .commit("Initial Commit");

const junior = graph
  .branch("junior")
  .commit("Initial commit");

const whitemails = graph
  .branch("whitemails")
  .commit("Automatic mailing system")
  .commit("Bots for Slack and Telegram")
  .merge(junior);

const itransition = graph
  .branch("Itransition")
  .commit("Distributed Travel Agency System")
  .commit("Firmware for HP printer")
  .commit("API payment system")
  .merge(junior);

junior.merge(master);

const middle = graph
  .branch("middle")
  .commit("Initial commit");

const leverx = graph
  .branch("leverx")
  .commit("Recruitment system")
  .commit("X5 Retail Group - Quality control system")
  .merge(middle);

middle.merge(master);

const senior = graph
  .branch("senior")
  .commit("Initial commit");
