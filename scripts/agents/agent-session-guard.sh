#!/usr/bin/env bash

agent_cli_name_from_token() {
  local token="${1:-}"
  local base=""

  if [[ -z "$token" ]]; then
    return 1
  fi

  base="$(basename -- "$token")"
  case "$base" in
    codex|claude)
      printf '%s\n' "$base"
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

interactive_shell_name_from_token() {
  local token="${1:-}"
  local base=""

  if [[ -z "$token" ]]; then
    return 1
  fi

  base="$(basename -- "$token")"
  case "$base" in
    bash|sh|zsh)
      printf '%s\n' "$base"
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

command_string_from_argv() {
  local token=""
  local joined=""

  if (( $# == 0 )); then
    return 1
  fi

  for token in "$@"; do
    if [[ -n "$joined" ]]; then
      joined+=" "
    fi
    joined+="$token"
  done

  printf '%s\n' "$joined"
}

detect_long_lived_non_write_command_in_string() {
  local command_string="${1:-}"
  local package_manager_regex='(^|[[:space:]])(pnpm|npm|yarn|bun)([[:space:]][^;&|]+)*[[:space:]]((run|exec)[[:space:]]+)?(dev|start|storybook|preview|serve|watch)([[:space:]]|$)'
  local direct_command_regex='(^|[[:space:]])((next[[:space:]]+dev)|(wrangler[[:space:]]+dev)|(vite([[:space:]]+(dev|preview))?)|(storybook([[:space:]]+(dev|serve))?)|(nodemon)|(tsx[[:space:]]+watch))([[:space:]]|$)'

  if [[ -z "$command_string" ]]; then
    return 1
  fi

  if [[ "$command_string" =~ $package_manager_regex ]]; then
    printf '%s\n' "${BASH_REMATCH[7]}"
    return 0
  fi

  if [[ "$command_string" =~ $direct_command_regex ]]; then
    printf '%s\n' "${BASH_REMATCH[2]}"
    return 0
  fi

  return 1
}

detect_long_lived_agent_cli_in_shell_command() {
  local script="${1:-}"
  local shell_command_regex='(^|[;&|][;&|]?)[[:space:]]*(((env[[:space:]]+([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]+[[:space:]]+)*)|(nvm[[:space:]]+exec([[:space:]]+[^[:space:]]+)?[[:space:]]+)|((pnpm|npm|yarn|bun)[[:space:]]+(exec|dlx|x)[[:space:]]+)|((npx|pnpx|bunx)[[:space:]]+)|(node[[:space:]]+))?([^[:space:];|&()]*\/)?(codex|claude))([[:space:]]|$))'
  local match=""

  if [[ -z "$script" ]]; then
    return 1
  fi

  if [[ "$script" =~ $shell_command_regex ]]; then
    match="${BASH_REMATCH[0]}"
    if [[ "$match" =~ (^|[^[:alnum:]_-])(codex|claude)([^[:alnum:]_-]|$) ]]; then
      printf '%s\n' "${BASH_REMATCH[2]}"
      return 0
    fi
  fi

  return 1
}

detect_long_lived_non_write_command_in_shell_command() {
  local script="${1:-}"

  if [[ -z "$script" ]]; then
    return 1
  fi

  detect_long_lived_non_write_command_in_string "$script" && return 0
  return 1
}

detect_long_lived_agent_cli_after_wrapper() {
  local -a argv=("$@")
  local token=""
  local i=0

  while (( i < ${#argv[@]} )); do
    token="${argv[i]}"
    case "$token" in
      --)
        ((i++))
        break
        ;;
      -*)
        ((i++))
        continue
        ;;
      *)
        break
        ;;
    esac
  done

  if (( i < ${#argv[@]} )); then
    detect_long_lived_agent_cli "${argv[@]:i}" && return 0
  fi

  return 1
}

detect_long_lived_non_write_command_after_wrapper() {
  local -a argv=("$@")
  local i=0

  while (( i < ${#argv[@]} )); do
    case "${argv[i]}" in
      --)
        ((i++))
        break
        ;;
      -*)
        ((i++))
        continue
        ;;
      *)
        break
        ;;
    esac
  done

  if (( i < ${#argv[@]} )); then
    detect_long_lived_non_write_command "${argv[@]:i}" && return 0
  fi

  return 1
}

shell_invocation_opens_interactive_session() {
  local -a argv=("$@")
  local token=""

  if (( ${#argv[@]} == 0 )); then
    return 0
  fi

  for token in "${argv[@]}"; do
    case "$token" in
      -c|--command|-lc|-cl)
        return 1
        ;;
      -i|--interactive|-is|-si|-il|-li|-ic|-ci)
        return 0
        ;;
      -s)
        return 0
        ;;
      --)
        continue
        ;;
      -*)
        continue
        ;;
      *)
        return 1
        ;;
    esac
  done

  return 0
}

detect_long_lived_non_write_command() {
  local -a argv=("$@")
  local first=""
  local token=""
  local i=0
  local command_string=""

  if (( ${#argv[@]} == 0 )); then
    return 1
  fi

  if command_string="$(command_string_from_argv "${argv[@]}")"; then
    detect_long_lived_non_write_command_in_string "$command_string" && return 0
  fi

  first="${argv[0]}"
  case "$(basename -- "$first")" in
    command)
      if (( ${#argv[@]} > 1 )); then
        detect_long_lived_non_write_command "${argv[@]:1}" && return 0
      fi
      return 1
      ;;
    env)
      i=1
      while (( i < ${#argv[@]} )); do
        token="${argv[i]}"
        case "$token" in
          --)
            ((i++))
            break
            ;;
          -u)
            ((i += 2))
            continue
            ;;
          -*)
            ((i++))
            continue
            ;;
          [A-Za-z_][A-Za-z0-9_]*=*)
            ((i++))
            continue
            ;;
          *)
            break
            ;;
        esac
      done

      if (( i < ${#argv[@]} )); then
        detect_long_lived_non_write_command "${argv[@]:i}" && return 0
      fi
      return 1
      ;;
    bash|sh|zsh)
      for ((i = 1; i < ${#argv[@]}; i++)); do
        token="${argv[i]}"
        case "$token" in
          -c|-lc|-cl)
            detect_long_lived_non_write_command_in_shell_command "${argv[i+1]:-}" && return 0
            return 1
            ;;
        esac
      done
      return 1
      ;;
    with-git-guard.sh|integrator-shell.sh|with-writer-lock.sh)
      detect_long_lived_non_write_command_after_wrapper "${argv[@]:1}" && return 0
      return 1
      ;;
    *)
      return 1
      ;;
  esac
}

detect_interactive_shell_after_wrapper() {
  local -a argv=("$@")
  local token=""
  local i=0

  while (( i < ${#argv[@]} )); do
    token="${argv[i]}"
    case "$token" in
      --)
        ((i++))
        break
        ;;
      -*)
        ((i++))
        continue
        ;;
      *)
        break
        ;;
    esac
  done

  if (( i < ${#argv[@]} )); then
    detect_interactive_shell "${argv[@]:i}" && return 0
  fi

  return 1
}

detect_long_lived_agent_cli() {
  local -a argv=("$@")
  local first=""
  local token=""
  local agent=""
  local i=0

  if (( ${#argv[@]} == 0 )); then
    return 1
  fi

  first="${argv[0]}"
  if agent="$(agent_cli_name_from_token "$first")"; then
    printf '%s\n' "$agent"
    return 0
  fi

  case "$(basename -- "$first")" in
    command)
      if (( ${#argv[@]} > 1 )); then
        detect_long_lived_agent_cli "${argv[@]:1}" && return 0
      fi
      return 1
      ;;
    env)
      i=1
      while (( i < ${#argv[@]} )); do
        token="${argv[i]}"
        case "$token" in
          --)
            ((i++))
            break
            ;;
          -u)
            ((i += 2))
            continue
            ;;
          -*)
            ((i++))
            continue
            ;;
          [A-Za-z_][A-Za-z0-9_]*=*)
            ((i++))
            continue
            ;;
          *)
            break
            ;;
        esac
      done

      if (( i < ${#argv[@]} )); then
        detect_long_lived_agent_cli "${argv[@]:i}" && return 0
      fi
      return 1
      ;;
    nvm)
      if [[ "${argv[1]:-}" != "exec" ]]; then
        return 1
      fi

      i=2
      while (( i < ${#argv[@]} )); do
        token="${argv[i]}"
        case "$token" in
          --)
            ((i++))
            break
            ;;
          -*)
            ((i++))
            continue
            ;;
        esac

        if agent="$(agent_cli_name_from_token "$token")"; then
          printf '%s\n' "$agent"
          return 0
        fi

        ((i++))
        break
      done

      if (( i < ${#argv[@]} )); then
        detect_long_lived_agent_cli "${argv[@]:i}" && return 0
      fi
      return 1
      ;;
    pnpm|npm|yarn|bun)
      for ((i = 1; i < ${#argv[@]}; i++)); do
        token="${argv[i]}"
        case "$token" in
          exec|dlx|x)
            detect_long_lived_agent_cli_after_wrapper "${argv[@]:$((i + 1))}" && return 0
            return 1
            ;;
        esac
      done
      return 1
      ;;
    npx|pnpx|bunx)
      detect_long_lived_agent_cli_after_wrapper "${argv[@]:1}" && return 0
      return 1
      ;;
    node)
      for ((i = 1; i < ${#argv[@]}; i++)); do
        token="${argv[i]}"
        case "$token" in
          --)
            if (( i + 1 < ${#argv[@]} )); then
              agent_cli_name_from_token "${argv[i+1]}" && return 0
            fi
            return 1
            ;;
          -r|--require|--import|--loader|--experimental-loader|--conditions|--input-type|-e|--eval|-p|--print)
            ((i++))
            continue
            ;;
          -*)
            continue
            ;;
          *)
            if agent="$(agent_cli_name_from_token "$token")"; then
              printf '%s\n' "$agent"
              return 0
            fi
            return 1
            ;;
        esac
      done
      return 1
      ;;
    bash|sh|zsh)
      for ((i = 1; i < ${#argv[@]}; i++)); do
        token="${argv[i]}"
        case "$token" in
          -c|-lc|-cl)
            detect_long_lived_agent_cli_in_shell_command "${argv[i+1]:-}" && return 0
            return 1
            ;;
        esac
      done
      return 1
      ;;
    with-git-guard.sh|integrator-shell.sh|with-writer-lock.sh)
      detect_long_lived_agent_cli_after_wrapper "${argv[@]:1}" && return 0
      return 1
      ;;
    *)
      return 1
      ;;
  esac
}

detect_interactive_shell() {
  local -a argv=("$@")
  local first=""
  local token=""
  local shell_name=""
  local i=0

  if (( ${#argv[@]} == 0 )); then
    return 1
  fi

  first="${argv[0]}"
  if shell_name="$(interactive_shell_name_from_token "$first")"; then
    if shell_invocation_opens_interactive_session "${argv[@]:1}"; then
      printf '%s\n' "$shell_name"
      return 0
    fi
    return 1
  fi

  case "$(basename -- "$first")" in
    command)
      if (( ${#argv[@]} > 1 )); then
        detect_interactive_shell "${argv[@]:1}" && return 0
      fi
      return 1
      ;;
    env)
      i=1
      while (( i < ${#argv[@]} )); do
        token="${argv[i]}"
        case "$token" in
          --)
            ((i++))
            break
            ;;
          -u)
            ((i += 2))
            continue
            ;;
          -*)
            ((i++))
            continue
            ;;
          [A-Za-z_][A-Za-z0-9_]*=*)
            ((i++))
            continue
            ;;
          *)
            break
            ;;
        esac
      done

      if (( i < ${#argv[@]} )); then
        detect_interactive_shell "${argv[@]:i}" && return 0
      fi
      return 1
      ;;
    with-git-guard.sh|integrator-shell.sh|with-writer-lock.sh)
      detect_interactive_shell_after_wrapper "${argv[@]:1}" && return 0
      return 1
      ;;
    *)
      return 1
      ;;
  esac
}
