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

detect_long_lived_agent_cli_in_shell_command() {
  local script="${1:-}"
  local shell_command_regex='(^|[;&|][;&|]?)[[:space:]]*((env[[:space:]]+([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]+[[:space:]]+)*)|(nvm[[:space:]]+exec([[:space:]]+[^[:space:]]+)?[[:space:]]+))?([^[:space:];|&()]*\/)?(codex|claude)([[:space:]]|$)'

  if [[ -z "$script" ]]; then
    return 1
  fi

  if [[ "$script" =~ $shell_command_regex ]]; then
    printf '%s\n' "${BASH_REMATCH[8]}"
    return 0
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
    *)
      return 1
      ;;
  esac
}
