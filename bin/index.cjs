#! /usr/bin/env node

const { exec } = require('child_process');
const axios = require('axios');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk'); // Assuming you have chalk installed

// Define the path to the configuration file relative to the script's location
const configFilePath = path.join(__dirname, 'openai_config.json');

// Function to save the API key to a config file
const saveApiKey = (apiKey) => {
  fs.writeFileSync(configFilePath, JSON.stringify({ apiKey }));
};

const handleConfigCommand = (key) => {
    saveApiKey(key);
    console.log('API key configured successfully.');
  };

// Function to read the API key from the config file
const getApiKey = () => {
  if (fs.existsSync(configFilePath)) {
    const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    return config.apiKey;
  }
  return null;
};

// Function to execute the command and capture its output
const executeCommand = (command, callback) => {
  exec(command, (error, stdout, stderr) => {
    callback(error, stdout, stderr);
  });
};

// Function to read content from multiple files with optional line numbers
const readFileContent = (filePaths) => {
    // Ensure filePaths is always an array
    if (!Array.isArray(filePaths)) {
      filePaths = [filePaths];
    }

    console.log('file paths', filePaths);
  
    return filePaths.map(filePath => {
      // Splitting the file path and line numbers
      const [path, lineRange] = filePath.split(':');
      const startLine = lineRange ? parseInt(lineRange.split('-')[0], 10) : null;
      const endLine = lineRange ? parseInt(lineRange.split('-')[1], 10) : null;
  
      try {
        const fileContent = fs.readFileSync(path, 'utf8');
        let content = `File Path: ${filePath}\n`;
        if (startLine !== null && endLine !== null) {
          // Selecting specific lines and prepending the file path
          content += fileContent.split('\n').slice(startLine - 1, endLine).join('\n');
        } else {
          content += fileContent;
        }
        return content;
      } catch (error) {
        console.error(`Error reading file: ${path}`, error.message);
        return `Error reading file: ${filePath}`;
      }
    }).join('\n\n'); // Concatenate contents of all files, separated by two newlines
};

// Function to send request to OpenAI
const sendOpenAIRequest = async (output, fileContent) => {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.log(chalk.black('Hi! 👋 Get your OpenAI API key from https://platform.openai.com/account/api-keys to get started using aidebugs. This isn\'t stored anywhere! \n'));
    console.error('Run: aidebugs config --key <your_api_key> \n');
    return;
  }
  let content = output;
  if (fileContent) {
    content += `\nFile Content:\n${fileContent}`;
  }

  console.log(chalk.bgRed(chalk.white(`The error message being addressed: \n`))); 
  console.log(`${output}`); 

  console.log(chalk.bgBlue(chalk.white('Sending error to OpenAI API \n')));
  console.log('Processing 🌀 Please wait... \n')
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        messages: [{ role: "system", content: "Help me understand why I'd be getting this error, and if I've provided file content explain how I should change it if needed to fix the error:"}, { role: "user", content }],
        model: "gpt-4",
    }, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    });

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error', error.message);
  }
};

// Main function
const main = async () => {
    executeCommand(argv.command, async (error, stdout, stderr) => {
      let output = error ? stderr : stdout;
      const fileContent = argv.file ? readFileContent(argv.file) : null;

      // Start the loading indicator
      let loadingMessage = '';
      const loadingInterval = setInterval(() => {
        process.stdout.write(`\r${loadingMessage}`);
        loadingMessage += '.';
      }, 500); // Update the message every 500ms
  
      try {
        const answer = await sendOpenAIRequest(output, fileContent);
        clearInterval(loadingInterval); // Clear the loading indicator
        if (answer == undefined) {
            return;
        }
        console.log(chalk.bgGreen(chalk.white(`\r Tips to get rid of the error: \n`)));
        console.log(`${answer}`);
        console.log('\n')
      } catch (error) {
        clearInterval(loadingInterval); // Clear the loading indicator
        console.error(`\r${chalk.red(`Error: ${error.message}`)}`);
      }
    });
  };
  

// Command line argument parsing
const argv = yargs(hideBin(process.argv))
  .option('command', {
    alias: 'c',
    describe: 'Command to execute',
    type: 'string',
  })
  .option('file', {
    alias: 'f',
    describe: 'Files to include in the request',
    type: 'array',
  })
  .command('config', 'Configure API key', {
    key: {
      alias: 'apiKey',
      describe: 'OpenAI API key',
      type: 'string',
      demandOption: true,
    },
  })
  .help()
  .argv;

// Determine which command is being used
if (argv._.includes('config')) {
  // Handle 'config' command
  if (argv.key) {
    saveApiKey(argv.key);
    console.log('API key configured successfully.');
  } else {
    console.error('API key is required for config command');
  }
} else {
  // Proceed with the main function for other commands
  if (!argv.command) {
    console.error('Missing required argument: command');
  } else {
    main();
  }
}