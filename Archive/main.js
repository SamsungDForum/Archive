(function () {
    'use strict';

    // virtual root
    var directory = 'wgt-private-tmp/';

    /* add and print logs
     * @param {String} action - name of resource
      * @param {String} log - message or information to be printed
      * @private
      */
    function log (msg) {
        var logsEl = document.getElementById('logs');

        if (msg) {
            // Update logs
            console.log('[Archive]: ', msg);
            logsEl.innerHTML += msg + '<br />';
        } else {
            // Clear logs
            logsEl.innerHTML = '';
        }

        logsEl.scrollTop = logsEl.scrollHeight;
    }


    /**
     * Register keys used in this application
     */
    function registerKeys() {
        var usedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8'];

        usedKeys.forEach(
            function (keyName) {
                tizen.tvinputdevice.registerKey(keyName);
            }
        );
    }


    /**
     * Handle input from remote
     */
    function registerKeyHandler() {
        document.addEventListener('keydown', function (e) {
            switch (e.keyCode) {
                //Key 0
                case 48:
                    log();
                    break;
                //Key 1
                case 49:
                    showArchive(directory + 'files.zip');
                    break;
                //Key 2
                case 50:
                	showSingleFileArchive(directory + 'files.zip', 'file2.txt');
                	break;
                //Key 3
                case 51:
                    var fullPath = directory + 'fileToArchive.txt';
                    add(directory + 'archive.zip', [fullPath], function () {
                    	console.log('completed to create archive file');
                    });
                    break;
                //Key 4
                case 52:
                    createAndAddFilesToArchive(directory + 'files.zip', 'file3.txt');
                    break;
                //Key 5
                case 53:
                    extractSingleFile(directory + 'files.zip', 'file1.txt');
                    break;
                //Key 6
                case 54:
                    extractAll(directory + 'files.zip');
                    break;
                //Key 7
                case 55:
                    abort(directory + 'files.zip');
                    break;
                //Key 8
                case 56:
                    init();
                    break;
                // Key Return
                case 10009:
                    tizen.application.getCurrentApplication().exit();
                    break;
            }
        });
    }

    /**
     * Display application version
     */
    function displayVersion() {
        var el = document.createElement('div');
        el.id = 'version';
        el.innerHTML = 'ver: ' + tizen.application.getAppInfo().version;
        document.body.appendChild(el);
    }

    function updateFilesList () {
        var filesDiv = document.getElementById('files');

        _getFilesList(function (files) {
            filesDiv.innerHTML = files.join('<br/>');
        });
    }


    /* print the list of files from directory
    * @param {Function} callback - function to be called after getting files list
    * @private
    */
    function _getFilesList (callback) {
        var success,
            list = [];

        success = function (dir) {
            dir.listFiles(function (files) {
                var i;
                for (i = 0; i < files.length; i++) {
                    list.push(files[i].fullPath);
                }
                callback(list);
            });
        };
        _openDirectory(directory, success, 'r');
    }

    /*
     *  helper to open an archive
     *  @param {String} archive - filename of archive
     *  @param {String} mode - mode of opening archive
     *  @param {Function} success - function to be called when archive will be opened
     *  @private
     */
     function _openArchive (archive, mode, success) {
        var failure;

        failure = function (error) {
            log(['couldn\'t open an archive' + archive + '<br/>' + JSON.stringify(error)].join(' '));
        };

        tizen.archive.open(archive, mode, success, failure);
     }

    /**
     * helper to open a directory
     * @param {String} dir - path to directory
     * @param {String} mode  - mode of opening directory
     * @param {Function} success - function to be called when directory will be opened
     * @private
     */
     function _openDirectory (dir, success, mode) {
        var failure;

        failure = function (error) {
            log(['couldn\'t open a directory',  dir, ':<br/>', JSON.stringify(error)].join(' '));
        };

        tizen.filesystem.resolve(dir, success, failure, mode);
    }

    /*
     * create or modify an archive by adding new files
     * @param {String} archive - filename of an archive to create or modify
     * @param {Arrays<String>} files - array of files to add
     * @param {Function} callback - function which be called after archive will be created
     */
    function add (archive, files, callback) {
        var i,
            success;

        success = function (archiveFile) {
            var fullPath;

            for (i = 0; i < files.length; i++) {
                fullPath = files[i];
                archiveFile.add(fullPath, function () {
                    log(['added a file', fullPath, 'to an archive', archive].join(' '));
                    updateFilesList();
                }, function (error) {
                    log(['couldn\'t add a file', fullPath, 'to an archive', archive,':<br/>', JSON.stringify(error)].join(' '));
                    updateFilesList();
                }, function (opID, progress, filename) {
                    log(['adding a file', filename, 'to an archive', archive, ":", (progress * 100), '%'].join(' '));
                    updateFilesList();
                });
            }
            callback();
        };

        _openArchive(archive, "a", success);
    }

    /*
     * show all files from an given archive
     * @param {String} archive - filename of an archive to open
     */
    function showArchive (archive) {
        var success;

        success = function (dir) {
        	dir.getEntries(function (files) {
                log(['received a list of files from an archive', archive, ':<br/>' , JSON.stringify(files)].join(' '));
                updateFilesList();
                dir.close();
            }, function (error) {
                log(['couldn\'t show a list of files from an archive', archive, ':<br/>', JSON.stringify(error)].join(' '));
                updateFilesList();
            });
        };

        _openArchive(archive, 'r', success);
    }

    /*
     * show a single file from an given archive without extracting
     * @param {String} archive - filename of an archive to open
     * @param {String} file - filename of a file to show
     */
    function showSingleFileArchive (archive, file) {
        var success;

        success = function (dir) {
        	dir.getEntryByName(file, function (archiveFile) {
                log(['received a file', file, 'from an archive', archive, ':<br/>', JSON.stringify(archiveFile)].join(' '));
                updateFilesList();
                dir.close();
            }, function (error) {
                log(['couldn\'t show a file', file, 'from an archive', archive, ':<br/>', JSON.stringify(error)].join(' '));
                updateFilesList();
            });
        };

        _openArchive(archive, 'r', success);
    }

    /*
     * extract only a single file from an given archive
     * @param {String} archive - a filename of archive
     * @param {String} file - a filename of file to extract
     */
    function extractSingleFile (archive, file) {
        var success;

        success = function (dir) {
        	dir.getEntryByName(file, function (archiveFile) {
                archiveFile.extract(directory, function () {
                    log(['extracted a single file', file, 'from an archive', archive].join(' '));
                    updateFilesList();
                    dir.close();
                }, function (error) {
                    log(['couldn\'t extract a single file ', file, 'from an archive', archive, ':<br/>', JSON.stringify(error)].join(' '));
                    updateFilesList();
                });
            });
        };

        _openArchive(archive, 'r', success);
    }

    /*
     * extract all files from an given archive
     * param {String} archive - a filename of archive to extract
     */
    function extractAll (archive) {
        var success;

        success = function (dir) {
        	dir.extractAll(directory, function () {
                log(['extracted all files from an archive', archive].join(' '));
                updateFilesList();
                dir.close();
            }, function (error) {
                log(['couldn\'t extract all files from an archive', archive, ':<br/>', JSON.stringify(error)].join(' '));
                updateFilesList();
            }, function (operationID, progress, filename) {
                log(['extracting a file', filename, 'from an archive', archive, ':', (progress * 100), '%'].join(' '));
                updateFilesList();
            }, true);
        };

        _openArchive(archive, 'r', success);
    }

    /**
     * abort extracting all action
     * @param {String} archive - a filename of archive to extract
     */
    function abort (archive) {
        var operationID,
            success;

        success = function (dir) {
            log(['opened archive', archive].join(' '));
            operationID = dir.extractAll(directory, function () {
                log(['extracted all files from an archive', archive].join(' '));
                updateFilesList();
                dir.close();
            }, null, null, true);
            try {
                tizen.archive.abort(operationID);
                log(['aborted extractAll action on the archive', archive].join(' '));
            } catch (e) {
                log(['couldn\'t abort extractAll action', e.message].join(' '));
            }
        };

        _openArchive(archive, 'r', success);
    }

    /*
    * create a new file and add it to existing archive
    * @param {String} archive - a filename of archive to modify
    * @param {String} file - a name of file to create
    */
    function createAndAddFilesToArchive (archive, file) {
    	var fullPath = directory + file;
    	tizen.filesystem.resolve(directory, function(dir) {
    		dir.createFile(file);
            
            add(directory + 'files.zip', [fullPath], function () {
        		console.log('completed to create archive file');
            });
    	}, function(e) {
    		console.log("The error " + e.message);
    	}, "rw");
    }

    /*
     * initialize files structure - create an example file and archive
     */
    function init () {
        var i,
        	createExampleFiles;
        
        log();
        
        createExampleFiles = function () {
        	tizen.filesystem.resolve(directory, function(dir) {
        		dir.createFile("file1.txt");
        		dir.createFile("file2.txt");
                dir.createFile("fileToArchive.txt");
                
                add(directory + 'files.zip', [directory + 'file1.txt', directory + 'file2.txt'], function () {
            		console.log('completed to create archive file');
                });
        	}, function(e) {
        		console.log("The error " + e.message);
        	}, "rw");
        };
        
        tizen.filesystem.resolve(directory, function(dir) {
    		dir.listFiles(function(files){
    			for (i = 0; i < files.length; i++) {
                    if (files[i].isDirectory) {
                    	dir.deleteDirectory(files[i].fullPath, true);
                    } else {
                    	dir.deleteFile(files[i].fullPath);
                    }
                }
    			createExampleFiles();
    		}, function(e) {
    			console.log('Error : ' + e);
    		});
        }, function(e) {
        	console.log("Error" + e.message);
        }, "rw");
    }

    /*
     * onload
     */
    window.onload = function () {
    	if (window.tizen === undefined) {
            log('This application needs to be run on a Tizen device');
            return;
        }

        displayVersion();
        registerKeys();
        registerKeyHandler();

        init();
    };
} ());
