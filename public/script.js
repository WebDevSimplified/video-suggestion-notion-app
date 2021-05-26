document.addEventListener("click", e => {
  if (e.target.matches("[data-up-vote-btn")) handleUpVote(e.target)
})

document.querySelector("[data-form]").addEventListener("submit", e => {
  const submitBtn = e.target.querySelector("[data-submit-btn]")
  if (submitBtn.disabled) e.preventDefault()
  submitBtn.disabled = true
})

function handleUpVote(button) {
  const suggestionCard = button.closest("[data-suggestion-id]")
  button.disabled = true
  fetch("/suggestions/up-vote-suggestion", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ suggestionId: suggestionCard.dataset.suggestionId }),
  })
    .then(res => {
      if (res.ok) return res.json()
      return res.text().then(text => Promise.reject(text))
    })
    .then(({ votes }) => {
      const upVoteCount = suggestionCard.querySelector("[data-up-vote-count]")
      upVoteCount.textContent = votes
    })
    .catch(alert)
    .finally(() => {
      button.disabled = false
    })
}
