!{
    "title": "Bash: function converts relative file path to absolute",
    "image": "https://dl.dropboxusercontent.com/s/xjuflro0gilf6gm/2015-12-06-12-41-00-how-to-find-raspberry-pi-ip-address.jpeg",
    "date": "2015-12-10"
}

<!-- preview -->

For get full files or directris path in scripts I uses this simple function.

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

Download from [Github](https://gist.githubusercontent.com/antonfisher/fb8a9bdb4b9fc2d44134/raw/cc01888a29c874c181992085db42d812ce3acd9b/get_full_path.sh).

_Note: I use Ubuntu._
