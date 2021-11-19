module.exports = async ({github, owner, repo}) => {
    console.log(`Looking at this repository: [${owner}/${repo}]`)

    const {
        viewer: { login },
      } = await github.graphql(`{
        viewer {
          login
        }
      }`);
      

    console.log(`Repository result: ${login}`)
      

}