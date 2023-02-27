<p align="center">
<img src="https://github.com/forensicxlab/VISION-ProcMon/blob/main/src/assets/vision_readme.svg"  width="200" height="280" alt="VISION-ProcMon"/>
</p>

# What is VISION-ProcMon

VISION-ProcMon is a tool dedicated for malware analysis and specifically when performing behavioral analysis. VISION-ProcMon is using a combination of the rust and web technologies in order to provide a fast and better visualization of the behavior of a malware after capturing its activity with ProcMon tool. VISION-ProcMon is not made to be used by a system administrator that want to investigate a process for debugging purposes.
SCREENSHOTS HERE

## Use case
To better understand the capabilities of this tool, you may check this blog article demonstrating the behavioral analysis of a malware using VISION-ProcMon : [LINK HERE]

# Install
VISION-ProcMon is cross platform, the release contains all the bundles. However if you seek to check the code first and build the app yourself here are the instructions to follow:

```
git clone https://github.com/forensicxlab/VISION-ProcMon.git
cd VISION-ProcMon
npm install 
npm run tauri build
```


# Contributing
VISION-ProcMon is not yet open to contributions. However, you can declare a bug or propose a feature via a github issue.
