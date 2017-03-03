module.exports = function (grunt) {

    require('time-grunt')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*!\n' +
        ' * Simple Chart v<%= pkg.version %>' +
        ' * Copyright 2017-<%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
        ' * Licensed under the <%= pkg.license %> license\n' +
        ' */\n',
        uglify: {
            options: {
                banner: '<%= banner %>'
            },
            build: {
                files: {'dist/js/app.min.js': 'src/js/app.js'}
            }
        },
        less: {
            options: {
                banner: '<%= banner %>'
            },
            build: {
                files: {
                    'dist/css/style.css': 'src/css/less/style.less'
                }
            }
        },
        copy: {
            main: {
                files: [
                    {expand: true, cwd: 'src/img', src: ['**'], dest: 'dist/img/'},
                    {expand: true, cwd: 'src/view', src: ['**'], dest: 'dist/view/'}
                ]
            }
        },
        clean: {
            folder: ['dist']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default', ['clean', 'uglify', 'less', 'copy']);
};
