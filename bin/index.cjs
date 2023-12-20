#! /usr/bin/env node

const { exec } = require('child_process');
const axios = require('axios');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs');
const configFilePath = './openai_config.json';

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

// Function to send request to OpenAI
const sendOpenAIRequest = async (output) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('No OpenAI API key configured. Please set the key using the config command.');
    return;
  }

  console.log("Logging question:", output);
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        messages: [{ role: "user", content: "Help me understand why I'd be getting this error: " + output }],
        model: "gpt-3.5-turbo",
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
    if (error) {
        const output = stderr;
        const answer = await sendOpenAIRequest(output);
        console.log(`Answer: ${answer}`);
    } else {
        console.log('Command executed successfully:', stdout);
    }
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
