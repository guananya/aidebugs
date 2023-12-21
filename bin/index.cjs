#! /usr/bin/env node

const { exec } = require('child_process');
const axios = require('axios');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const path = require('path');
const fs = require('fs');

// Define the path to the configuration file relative to the script's location
const configFilePath = path.join(__dirname, 'openai_config.json');

// Function to save the API key to a config file
const saveApiKey = (apiKey) => {
  fs.writeFileSync(configFilePath, JSON.stringify({ apiKey }));
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

// Function to read content from a file with optional line numbers
const readFileContent = (filePath) => {
    console.log('file path', filePath);
  
    // Splitting the file path and line numbers
    const [path, lineRange] = filePath.split(':');
    const startLine = lineRange ? parseInt(lineRange.split('-')[0], 10) : null;
    const endLine = lineRange ? parseInt(lineRange.split('-')[1], 10) : null;
  
    try {
      const fileContent = fs.readFileSync(path, 'utf8');
      if (startLine !== null && endLine !== null) {
        // Selecting specific lines
        return fileContent.split('\n').slice(startLine - 1, endLine).join('\n');
      }
      return fileContent;
    } catch (error) {
      console.error(`Error reading file: ${path}`, error.message);
      return null;
    }
  };

// Function to send request to OpenAI
const sendOpenAIRequest = async (output, fileContent) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('No OpenAI API key configured. Please set the key using the config command.');
    return;
  }

  let content = output;
  if (fileContent) {
    content += `\nFile Content:\n${fileContent}`;
  }

  console.log("Logging question:", content);

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        messages: [{ role: "system", content: "Help me understand why I'd be getting this error:"}, { role: "user", content }],
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
    console.log("file", argv.file);
    const fileContent = argv.file ? readFileContent(argv.file) : null;
    const answer = await sendOpenAIRequest(output, fileContent);
    console.log(`Answer: ${answer}`);
  });
};

// Command line argument parsing
const argv = yargs(hideBin(process.argv))
  .command('run', 'Execute a command', {
    command: {
      alias: 'c',
      describe: 'Command to execute',
      type: 'string',
      demandOption: true,
    },
    file: {
      alias: 'f',
      describe: 'File to include in the request',
      type: 'string',
    },
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
if (argv._.includes('config') && argv.key) {
  saveApiKey(argv.key);
  console.log('API key configured successfully.');
} else {
  main();
} 