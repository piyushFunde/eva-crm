@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    http://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM ----------------------------------------------------------------------------
@REM Maven Start Up Batch script
@REM ----------------------------------------------------------------------------

@echo off
@setlocal

set ERROR_CODE=0

@REM To isolate internal variables from possible objects of the same name in the environment
set WRAPPER_JAR="true"
set WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

set DOWNLOAD_URL="https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.1.0/maven-wrapper-3.1.0.jar"

set MAVEN_PROJECTBASEDIR=%~dp0
if not "%MAVEN_PROJECTBASEDIR%"=="" set MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%

set WRAPPER_JAR_FILE="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"
set WRAPPER_PROPERTIES="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.properties"

@REM Create wrapper directories if they do not exist
if not exist "%MAVEN_PROJECTBASEDIR%\.mvn\wrapper" (
    mkdir "%MAVEN_PROJECTBASEDIR%\.mvn\wrapper"
)

@REM Download jar if not exists
if not exist %WRAPPER_JAR_FILE% (
    echo Downloading Maven Wrapper...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%DOWNLOAD_URL:~1,-1%' -OutFile '%WRAPPER_JAR_FILE:~1,-1%'"
)

@REM Create properties file if not exists
if not exist %WRAPPER_PROPERTIES% (
    echo distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.8.5/apache-maven-3.8.5-bin.zip>%WRAPPER_PROPERTIES%
)

@REM Run java with the wrapper launcher
set "JAVACMD=java"
if not "%JAVA_HOME%"=="" (
    set "JAVACMD=%JAVA_HOME%\bin\java.exe"
) else if exist "C:\Program Files\Java\jdk-17\bin\java.exe" (
    set "JAVACMD=C:\Program Files\Java\jdk-17\bin\java.exe"
)
"%JAVACMD%" -classpath %WRAPPER_JAR_FILE% "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" %WRAPPER_LAUNCHER% %*

if ERRORLEVEL 1 (
    set ERROR_CODE=1
)

@endlocal & set ERROR_CODE=%ERROR_CODE%

exit /B %ERROR_CODE%
