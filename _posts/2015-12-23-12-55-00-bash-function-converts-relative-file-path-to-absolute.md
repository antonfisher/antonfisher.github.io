{
    "title": "Bash: function converts relative file path to absolute",
    "image": "https://dl.dropboxusercontent.com/s/qs5ao8tbaxrwe6t/bash-terminal.png",
    "imagePreview": "https://dl.dropboxusercontent.com/s/7siaado58ejettd/bash-terminal-300.png",
    "metaDescription": "bash, path, ubuntu",
    "date": "2015-12-23"
}

<!-- preview -->

For converting relative path to absolute full path in scripts I use this simple function.
Also it fits for path which contain '~'.

<!-- /preview -->

``` bash
##
# Get full file/directory path
#
# Examples:
#   full_path=$(get_full_path '/tmp');       # /tmp
#   full_path=$(get_full_path '~/..');       # /home
#   full_path=$(get_full_path '../../../');  # /home
#
# @param {String} $1 - relative path
# @returns {String} absolute path
#
function get_full_path {
    local user_home;
    local user_home_sed;
    local rel_path;
    local result;
    user_home="${HOME//\//\\\/}";
    user_home_sed="s#~#${user_home}#g";
    rel_path=$( echo "${1}" | sed "${user_home_sed}" );
    result=$( readlink -e "${rel_path}" );
    echo "${result}";
}
```

Usage example:

``` bash
text="Enter path to applications folder:";
read -r -e -p "${text}" apps_path_user;
full_path=$(get_full_path "${apps_path_user}");
```

Download from [Github](https://gist.githubusercontent.com/antonfisher/fb8a9bdb4b9fc2d44134/raw/cc01888a29c874c181992085db42d812ce3acd9b/get_full_path.sh).

_Note: I use Ubuntu._
